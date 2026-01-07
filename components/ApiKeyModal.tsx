'use client';

import { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [fishAudioKey, setFishAudioKey] = useState('');
  
  // 加载已保存的 Key
  useEffect(() => {
    if (isOpen) {
      const savedOpenai = localStorage.getItem('openai_api_key') || '';
      const savedFish = localStorage.getItem('fish_audio_api_key') || '';
      setOpenaiKey(savedOpenai);
      setFishAudioKey(savedFish);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('fish_audio_api_key', fishAudioKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">API 配置</h2>
        <p className="text-sm text-gray-400 mb-6">
          您的 API Key 仅存储在本地浏览器中，用于调用 TTS 和 Whisper 服务。
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              OpenAI API Key (用于 Whisper 转录 / Pro TTS)
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fish Audio API Key (用于专业版 TTS - 可选)
            </label>
            <input
              type="password"
              value={fishAudioKey}
              onChange={(e) => setFishAudioKey(e.target.value)}
              placeholder="您的 Fish Audio Key"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}



