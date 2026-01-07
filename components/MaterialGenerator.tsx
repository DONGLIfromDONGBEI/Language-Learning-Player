'use client';

import { useState } from 'react';
import { JournalEntry } from '@/types';
import ApiKeyModal from './ApiKeyModal';
import { saveFile, generatePairId } from '@/utils/fileStorage';
import { uploadFileToCloud, saveFilePairToCloud } from '@/utils/cloudStorage';

interface MaterialGeneratorProps {
  onMaterialGenerated: (audioUrl: string, journalData: JournalEntry[], fileName: string) => void;
  onSaveComplete?: () => void; // 新增：保存成功后的回调
}

type GenerationStep = 'idle' | 'generating_audio' | 'transcribing' | 'saving' | 'syncing' | 'completed' | 'error';

export default function MaterialGenerator({ onMaterialGenerated, onSaveComplete }: MaterialGeneratorProps) {
  const [text, setText] = useState('');
  const [tier, setTier] = useState<'standard' | 'pro'>('standard');
  const [voice, setVoice] = useState('alloy'); // 默认女声
  const [referenceId, setReferenceId] = useState('');
  const [step, setStep] = useState<GenerationStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [generatedAudioBlob, setGeneratedAudioBlob] = useState<Blob | null>(null);
  const [generatedSrt, setGeneratedSrt] = useState<string>('');

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    // 检查 API Key
    const openaiKey = localStorage.getItem('openai_api_key');
    const fishKey = localStorage.getItem('fish_audio_api_key');
    
    if (!openaiKey) {
      setErrorMsg('需要 OpenAI API Key (用于 TTS 和字幕转录)');
      setIsConfigOpen(true);
      return;
    }

    setStep('generating_audio');
    setErrorMsg('');
    setGeneratedAudioBlob(null);
    setGeneratedSrt('');

    try {
      // 1. 生成音频
      const audioRes = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-fish-api-key': fishKey || '',
          'x-openai-api-key': openaiKey || ''
        },
        body: JSON.stringify({ 
          text, 
          tier,
          voice: tier === 'standard' ? voice : undefined, // 只有标准版传 voice
          referenceId: tier === 'pro' ? referenceId : undefined 
        }),
      });

      if (!audioRes.ok) {
        const errData = await audioRes.json();
        throw new Error(errData.error || '音频生成失败');
      }

      const audioBlob = await audioRes.blob();
      setGeneratedAudioBlob(audioBlob);

      // 2. 转录音频
      setStep('transcribing');
      
      const pairId = generatePairId();
      const baseName = `AI_${Date.now()}`;
      const audioFileName = `${baseName}.mp3`;
      const srtFileName = `${baseName}.srt`;

      const formData = new FormData();
      const audioFile = new File([audioBlob], audioFileName, { type: 'audio/mpeg' });
      formData.append('file', audioFile);
      formData.append('apiKey', openaiKey);

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json();
        throw new Error(errData.error || '字幕转录失败');
      }

      const { srt, journalData } = await transcribeRes.json();
      setGeneratedSrt(srt);

      // --- 3. 自动保存到本地库 ---
      setStep('saving');
      const srtFile = new File([srt], srtFileName, { type: 'text/plain' });

      await saveFile(audioFile, pairId, 'audio');
      await saveFile(srtFile, pairId, 'subtitle');

      // --- 4. 同步到云端 ---
      const openaiKeyForCloud = localStorage.getItem('openai_api_key');
      if (openaiKeyForCloud) {
        setStep('syncing');
        try {
          const cloudAudioUrl = await uploadFileToCloud(audioFile, pairId, 'audio');
          const cloudSrtUrl = await uploadFileToCloud(srtFile, pairId, 'subtitle');
          
          await saveFilePairToCloud(
            pairId,
            baseName,
            cloudAudioUrl,
            cloudSrtUrl,
            audioFileName,
            srtFileName
          );
        } catch (cloudErr) {
          console.error('自动云端同步失败:', cloudErr);
        }
      }

      // 通知列表刷新
      if (onSaveComplete) {
        onSaveComplete();
      }

      setStep('completed');
      
      const audioUrl = URL.createObjectURL(audioBlob);
      onMaterialGenerated(audioUrl, journalData, audioFileName);

    } catch (err: any) {
      console.error(err);
      setStep('error');
      setErrorMsg(err.message || '生成过程中发生未知错误');
    }
  };

  const downloadAssets = () => {
    if (generatedAudioBlob) {
      const url = URL.createObjectURL(generatedAudioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `material_${Date.now()}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    }
    if (generatedSrt) {
      const blob = new Blob([generatedSrt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `material_${Date.now()}.srt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-2xl border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
          ✨ 素材生成器 (AI Content Pipeline)
        </h2>
        <button
          onClick={() => setIsConfigOpen(true)}
          className="text-sm text-gray-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          配置 API
        </button>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此输入你想听写的文本（支持中英文混合）..."
          className="w-full h-32 bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder-gray-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">选择语音质量</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
            >
              <option value="standard">标准版 (OpenAI TTS)</option>
              <option value="pro">专业版 (Fish Audio / 声音克隆)</option>
            </select>
          </div>

          {tier === 'standard' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                选择人声
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              >
                <option value="alloy">Alloy (女声/中性 - 默认)</option>
                <option value="echo">Echo (男声)</option>
                <option value="shimmer">Shimmer (女声/柔和)</option>
                <option value="onyx">Onyx (男声/深沉)</option>
                <option value="nova">Nova (女声/活力)</option>
                <option value="fable">Fable (男声/英式)</option>
              </select>
            </div>
          )}

          {tier === 'pro' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                声音克隆 Reference ID (选填)
                <a href="https://fish.audio" target="_blank" rel="noreferrer" className="ml-1 text-blue-400 hover:underline">
                  获取ID
                </a>
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="例如: 7f9eb4a03788..."
                className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            {tier === 'standard' ? (
              <span className="text-yellow-500">⚠️ 提示：Edge TTS 暂时不可用，当前使用 OpenAI TTS。</span>
            ) : (
              <span>💎 提示：专业版使用 Fish Audio，支持高质量克隆。需配置 API Key。</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 'completed' && (
              <button
                onClick={downloadAssets}
                className="text-sm text-green-400 hover:text-green-300 underline"
              >
                下载文件
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={!text.trim() || ['generating_audio', 'transcribing', 'saving', 'syncing'].includes(step)}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                !text.trim() || ['generating_audio', 'transcribing', 'saving', 'syncing'].includes(step)
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-900/30'
              }`}
            >
              {step === 'generating_audio' && '1/4 正在合成语音...'}
              {step === 'transcribing' && '2/4 正在生成字幕...'}
              {step === 'saving' && '3/4 正在保存到本地...'}
              {step === 'syncing' && '4/4 正在同步云端...'}
              {(step === 'idle' || step === 'completed' || step === 'error') && '开始生成素材'}
            </button>
          </div>
        </div>

        {step === 'completed' && (
          <div className="p-3 bg-green-900/20 border border-green-500/50 rounded-lg text-sm text-green-400 flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            素材已自动保存并同步到你的文件库！
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-200">
            ❌ {errorMsg}
          </div>
        )}
      </div>

      <ApiKeyModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
      />
    </div>
  );
}
