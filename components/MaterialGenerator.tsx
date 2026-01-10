'use client';

import { useState } from 'react';
import { JournalEntry } from '@/types';
import ApiKeyModal from './ApiKeyModal';
import { saveFile, generatePairId } from '@/utils/fileStorage';
import { uploadFileToCloud, saveFilePairToCloud } from '@/utils/cloudStorage';
import { parseSRT } from '@/utils/srtParser'; // 导入 parseSRT

interface MaterialGeneratorProps {
  onMaterialGenerated: (audioUrl: string, journalData: JournalEntry[], fileName: string) => void;
  onSaveComplete?: () => void;
}

type GenerationStep = 'idle' | 'generating_audio' | 'transcribing' | 'saving' | 'syncing' | 'completed' | 'error';
type SubtitleSource = 'openai' | 'edge' | 'aliyun';

export default function MaterialGenerator({ onMaterialGenerated, onSaveComplete }: MaterialGeneratorProps) {
  const [text, setText] = useState('');
  const [tier, setTier] = useState<'standard' | 'openai' | 'pro' | 'aliyun'>('standard');
  const [voice, setVoice] = useState('female'); 
  const [referenceId, setReferenceId] = useState('');
  const [subtitleSource, setSubtitleSource] = useState<SubtitleSource>('edge'); // 默认 Edge
  const [step, setStep] = useState<GenerationStep>('idle'); // 确保 step 被定义
  
  // 监听 tier 变化，自动调整默认字幕源和人声
  const handleTierChange = (newTier: 'standard' | 'openai' | 'pro' | 'aliyun') => {
    setTier(newTier);
    if (newTier === 'standard') {
      setSubtitleSource('edge');
      setVoice('female');
    } else if (newTier === 'aliyun') {
      setSubtitleSource('aliyun');
      setVoice('longxiaochun');
    } else {
      setSubtitleSource('openai');
      setVoice('alloy');
    }
  };
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [generatedAudioBlob, setGeneratedAudioBlob] = useState<Blob | null>(null);
  const [generatedSrt, setGeneratedSrt] = useState<string>('');

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    // 检查 API Key
    const openaiKey = localStorage.getItem('openai_api_key');
    const fishKey = localStorage.getItem('fish_audio_api_key');
    const aliyunApiKey = localStorage.getItem('aliyun_api_key');
    const aliyunAkId = localStorage.getItem('aliyun_ak_id');
    const aliyunAkSecret = localStorage.getItem('aliyun_ak_secret');
    const aliyunVoiceId = localStorage.getItem('aliyun_voice_id');
    
    // 检查是否需要 OpenAI Key
    // 1. Tier 是 OpenAI
    // 2. 字幕源是 OpenAI
    const needsOpenAI = tier === 'openai' || subtitleSource === 'openai';
    
    if (needsOpenAI && !openaiKey) {
      setErrorMsg('当前配置需要 OpenAI API Key (用于 TTS 或 Whisper 字幕)');
      setIsConfigOpen(true);
      return;
    }

    setStep('generating_audio');
    setErrorMsg('');
    setGeneratedAudioBlob(null);
    setGeneratedSrt('');

    try {
      // 1. 生成音频
      // 如果选择了 Edge 或 Aliyun 原生字幕，则请求 API 返回字幕
      const returnNativeSubtitles = (tier === 'standard' && subtitleSource === 'edge') || 
                                    (tier === 'aliyun' && subtitleSource === 'aliyun');
      
      const audioRes = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-fish-api-key': fishKey || '',
          'x-openai-api-key': openaiKey || '',
          'x-aliyun-api-key': aliyunApiKey || '',
          'x-aliyun-ak-id': aliyunAkId || '',
          'x-aliyun-ak-secret': aliyunAkSecret || '',
          'x-aliyun-voice-id': aliyunVoiceId || ''
        },
        body: JSON.stringify({ 
          text, 
          tier,
          voice: (tier === 'standard' || tier === 'openai' || tier === 'aliyun') ? voice : undefined, 
          referenceId: tier === 'pro' ? referenceId : undefined,
          returnSubtitles: returnNativeSubtitles
        }),
      });

      if (!audioRes.ok) {
        const errData = await audioRes.json();
        throw new Error(errData.error || '音频生成失败');
      }

      let audioBlob: Blob;
      let srtContent: string = '';
      let journalData: JournalEntry[] = [];

      // 处理响应 (可能是 JSON 也可能是音频流)
      const contentType = audioRes.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await audioRes.json();
        if (data.audio) {
            // Base64 to Blob
            const binaryString = window.atob(data.audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        } else {
             throw new Error('未返回音频数据');
        }
        
        // 只有当字幕源不是 OpenAI 时，才使用 API 返回的 SRT
        if (data.srt && subtitleSource !== 'openai') {
            srtContent = data.srt;
            // 解析 SRT 得到 journalData
            try {
                journalData = parseSRT(srtContent);
            } catch (e) {
                console.warn('解析生成的 SRT 失败:', e);
            }
        }
      } else {
        audioBlob = await audioRes.blob();
      }
      
      setGeneratedAudioBlob(audioBlob);

      // 2. 转录音频 (如果需要 Whisper)
      if (!srtContent || subtitleSource === 'openai') {
          // 阻断逻辑：如果用户选择了内置字幕（Edge/Aliyun）但没拿到字幕，直接报错，严禁回退到 OpenAI
          if (subtitleSource === 'aliyun' || subtitleSource === 'edge') {
              throw new Error(`【${subtitleSource === 'aliyun' ? '阿里云' : 'Edge'}】未返回有效字幕数据。请检查 API 配置或文本内容，不要尝试调用 OpenAI。`);
          }
          
          setStep('transcribing');
          
          const formData = new FormData();
          const tempFileName = `temp_${Date.now()}.mp3`;
          const audioFile = new File([audioBlob], 'speech.mp3', { type: 'audio/mpeg' }); // 固定文件名，避免 400
          formData.append('file', audioFile);
          formData.append('apiKey', openaiKey || ''); // 此时 openaiKey 应该存在，因为前面检查过了

          const transcribeRes = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!transcribeRes.ok) {
            const errData = await transcribeRes.json();
            throw new Error(errData.error || '字幕转录失败');
          }

          const result = await transcribeRes.json();
          srtContent = result.srt;
          journalData = result.journalData;
      }
      
      setGeneratedSrt(srtContent);

      // --- 3. 自动保存到本地库 ---
      setStep('saving');
      const pairId = generatePairId();
      const baseName = `AI_${Date.now()}`;
      const audioFileName = `${baseName}.mp3`;
      const srtFileName = `${baseName}.srt`;
      
      const audioFileToSave = new File([audioBlob], audioFileName, { type: 'audio/mpeg' });
      const srtFileToSave = new File([srtContent], srtFileName, { type: 'text/plain' });

      await saveFile(audioFileToSave, pairId, 'audio');
      await saveFile(srtFileToSave, pairId, 'subtitle');

      // --- 4. 同步到云端 ---
      const openaiKeyForCloud = localStorage.getItem('openai_api_key');
      // 注意：即使是免费用户，只要有 Key 也可以同步。如果没有 Key，可能只想本地用。
      // 这里逻辑稍微放宽：只要用户想同步(配置了Key或者之后添加了配置)，就尝试同步
      // 但现在我们只检查是否存在 Key 来决定是否同步，或者可以添加一个独立的开关
      // 暂时保持原样：有 Key 就同步
      if (openaiKeyForCloud) {
        setStep('syncing');
        try {
          const cloudAudioUrl = await uploadFileToCloud(audioFileToSave, pairId, 'audio');
          const cloudSrtUrl = await uploadFileToCloud(srtFileToSave, pairId, 'subtitle');
          
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
              onChange={(e) => handleTierChange(e.target.value as any)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
            >
              <option value="standard">标准版 (Edge TTS - 免费)</option>
              <option value="openai">高级版 (OpenAI TTS)</option>
              <option value="pro">专业版 (Fish Audio / 声音克隆)</option>
              <option value="aliyun">阿里云 (CosyVoice - 高精度)</option>
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
                <option value="female">Ava (女声 - 推荐)</option>
                <option value="male">Guy (男声)</option>
              </select>
            </div>
          )}

          {tier === 'openai' && (
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

          {tier === 'aliyun' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                选择人声 (Aliyun)
              </label>
              <input
                type="text"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                placeholder="cosyvoice / 或自定义 VoiceId"
                className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">支持复刻音色 VoiceId</p>
            </div>
          )}
          
          {/* 字幕生成方式选择 - 全局显示 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">选择字幕生成方式</label>
            <select
              value={subtitleSource}
              onChange={(e) => setSubtitleSource(e.target.value as SubtitleSource)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
            >
              {tier === 'standard' && <option value="edge">Edge 自动字幕 (免费 - 基础精度)</option>}
              {tier === 'aliyun' && <option value="aliyun">阿里云内置字幕 (需Key)</option>}
              <option value="openai">OpenAI Whisper (更精準/需 Key)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500 max-w-[60%]">
            {subtitleSource === 'edge' ? (
                <span className="text-green-400">✅ 提示：全链路免费！使用 Edge 生成音频与字幕。字幕精度一般，适合简单句子。</span>
            ) : subtitleSource === 'aliyun' ? (
                <span className="text-cyan-400">☁️ 提示：阿里云 CosyVoice 提供高音质 + 精准字幕 (需配置 API Key)。</span>
            ) : (
                <span className="text-blue-400">💡 提示：使用 OpenAI Whisper 生成高精度字幕 (需消耗 Token)。</span>
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
