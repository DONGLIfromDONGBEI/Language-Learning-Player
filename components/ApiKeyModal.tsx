import React, { useEffect, useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [fishAudioKey, setFishAudioKey] = useState('');
  
  // Aliyun Credentials
  const [aliyunApiKey, setAliyunApiKey] = useState('');
  const [aliyunAkId, setAliyunAkId] = useState('');
  const [aliyunAkSecret, setAliyunAkSecret] = useState('');
  const [aliyunVoiceId, setAliyunVoiceId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOpenaiKey(localStorage.getItem('openai_api_key') || '');
      setFishAudioKey(localStorage.getItem('fish_audio_api_key') || '');
      
      setAliyunApiKey(localStorage.getItem('aliyun_api_key') || '');
      setAliyunAkId(localStorage.getItem('aliyun_ak_id') || '');
      setAliyunAkSecret(localStorage.getItem('aliyun_ak_secret') || '');
      setAliyunVoiceId(localStorage.getItem('aliyun_voice_id') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (openaiKey.trim()) {
        localStorage.setItem('openai_api_key', openaiKey.trim());
    } else {
        localStorage.removeItem('openai_api_key');
    }

    if (fishAudioKey.trim()) {
        localStorage.setItem('fish_audio_api_key', fishAudioKey.trim());
    } else {
        localStorage.removeItem('fish_audio_api_key');
    }

    // Aliyun
    if (aliyunApiKey.trim()) localStorage.setItem('aliyun_api_key', aliyunApiKey.trim());
    else localStorage.removeItem('aliyun_api_key');

    if (aliyunAkId.trim()) localStorage.setItem('aliyun_ak_id', aliyunAkId.trim());
    else localStorage.removeItem('aliyun_ak_id');

    if (aliyunAkSecret.trim()) localStorage.setItem('aliyun_ak_secret', aliyunAkSecret.trim());
    else localStorage.removeItem('aliyun_ak_secret');

    if (aliyunVoiceId.trim()) localStorage.setItem('aliyun_voice_id', aliyunVoiceId.trim());
    else localStorage.removeItem('aliyun_voice_id');

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-700 animate-scale-in">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
            🔑 配置 API 密钥
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            密钥将安全存储在您的本地浏览器中（LocalStorage），不会上传到我们的服务器。
          </p>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {/* OpenAI */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OpenAI API Key
                <span className="text-xs text-gray-500 ml-2">(用于高级语音 & Whisper 字幕)</span>
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Fish Audio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fish Audio API Key
                <span className="text-xs text-gray-500 ml-2">(用于声音克隆)</span>
              </label>
              <input
                type="password"
                value={fishAudioKey}
                onChange={(e) => setFishAudioKey(e.target.value)}
                placeholder="YOUR_FISH_AUDIO_KEY"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Aliyun (阿里云) */}
            <div className="border-t border-gray-700 pt-4">
               <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-1">
                 ☁️ 阿里云 (Aliyun / CosyVoice) 配置
               </h3>
               <div className="space-y-3">
                   <div>
                       <label className="block text-xs text-gray-400 mb-1">API Key (推荐)</label>
                       <input
                           type="password"
                           value={aliyunApiKey}
                           onChange={(e) => setAliyunApiKey(e.target.value)}
                           placeholder="DashScope/GreenNet API Key"
                           className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                       <div>
                           <label className="block text-xs text-gray-400 mb-1">AccessKey ID (AK)</label>
                           <input
                               type="password"
                               value={aliyunAkId}
                               onChange={(e) => setAliyunAkId(e.target.value)}
                               placeholder="LTAI..."
                               className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                           />
                       </div>
                       <div>
                           <label className="block text-xs text-gray-400 mb-1">AccessKey Secret (SK)</label>
                           <input
                               type="password"
                               value={aliyunAkSecret}
                               onChange={(e) => setAliyunAkSecret(e.target.value)}
                               placeholder="******"
                               className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                           />
                       </div>
                   </div>
                   <div>
                       <label className="block text-xs text-gray-400 mb-1">VoiceId (选填, 复刻音色)</label>
                       <input
                           type="text"
                           value={aliyunVoiceId}
                           onChange={(e) => setAliyunVoiceId(e.target.value)}
                           placeholder="cosyvoice / 复刻音色 ID"
                           className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                       />
                   </div>
                   <p className="text-xs text-gray-500">
                     * 建议使用 API Key；AK/SK 仅在无 Key 时备用。
                   </p>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
