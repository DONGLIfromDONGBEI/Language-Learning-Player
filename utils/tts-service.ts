import { v4 as uuidv4 } from 'uuid';

// 类型定义
export type TTSTier = 'standard' | 'pro';

interface TTSRequest {
  text: string;
  tier: TTSTier;
  voice?: string; // OpenAI voice id (e.g., 'alloy', 'echo', 'shimmer')
  reference_id?: string;
}

const FISH_AUDIO_API_URL = 'https://api.fish.audio/v1/tts';

export async function generateAudio(request: TTSRequest): Promise<ArrayBuffer> {
  // 临时策略：全部回退到 OpenAI TTS
  
  if (request.tier === 'pro' && request.reference_id) {
    return await generateFishAudio(request.text, request.reference_id);
  } else {
    // 默认使用 OpenAI，如果传入了 voice 则使用，否则默认为 'alloy'
    return await generateOpenAITTS(request.text, request.voice);
  }
}

// ... Fish Audio 实现保持不变 ...
async function generateFishAudio(text: string, referenceId?: string): Promise<ArrayBuffer> {
    const apiKey = process.env.FISH_AUDIO_API_KEY;
    if (!apiKey) {
      throw new Error('请在配置中填写 Fish Audio API Key');
    }
  
    const voiceId = referenceId || '7f9eb4a0378844a4805eb3c7d6c634c0'; 
  
    try {
      const response = await fetch(FISH_AUDIO_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({
          text: text,
          reference_id: voiceId,
          format: 'mp3',
          mp3_bitrate: 128,
        }),
      });
  
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Fish Audio API Error: ${response.status} - ${errText}`);
      }
  
      return await response.arrayBuffer();
    } catch (error: any) {
      console.warn('Fish Audio failed:', error);
      if (process.env.OPENAI_API_KEY) {
         return await generateOpenAITTS(text);
      }
      throw error;
    }
}
  
async function generateOpenAITTS(text: string, voice: string = 'alloy'): Promise<ArrayBuffer> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('TTS 服务暂不可用。请配置 OpenAI API Key 以启用临时备选方案。');
  
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice, // 使用传入的声音
      }),
    });
  
    if (!response.ok) {
      throw new Error(`TTS API Error: ${response.statusText}`);
    }
  
    return await response.arrayBuffer();
}
