import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

// 类型定义
export type TTSTier = 'standard' | 'openai' | 'pro' | 'aliyun';

interface TTSRequest {
  text: string;
  tier: TTSTier;
  voice?: string; 
  reference_id?: string;
  returnSubtitles?: boolean;
  aliyunConfig?: {
    apiKey?: string; // DashScope/GreenNet 风格 API Key（推荐）
    akId?: string;   // 预留 AK/SK BYOK（如需换 Token）
    akSecret?: string;
    voiceId?: string; // 声音克隆/复刻音色 ID
  };
}

interface TTSResponse {
  audio: ArrayBuffer;
  srt?: string;
}

const FISH_AUDIO_API_URL = 'https://api.fish.audio/v1/tts';

// Edge TTS Constants
const EDGE_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const EDGE_HEADERS = {
  'Pragma': 'no-cache',
  'Cache-Control': 'no-cache',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36 Edg/90.0.818.46',
  'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
};

// 辅助：生成 SRT 时间戳格式 (00:00:01,000)
function formatSRTTimeFromSeconds(totalSecondsFloat: number): string {
  const totalMs = Math.floor(totalSecondsFloat * 1000);
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalSecondsFloat);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const pad = (n: number, w: number) => n.toString().padStart(w, '0');
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(ms, 3)}`;
}

export async function generateAudio(request: TTSRequest): Promise<TTSResponse> {
  if (request.tier === 'standard') {
    try {
      let edgeVoice = 'en-US-AvaNeural'; 
      if (request.voice === 'echo' || request.voice === 'male') {
        edgeVoice = 'en-US-GuyNeural';
      }
      console.log(`Attempting Edge TTS with voice: ${edgeVoice}`);
      return await generateEdgeAudioPhysicalAlignment(request.text, edgeVoice);
    } catch (error) {
      console.error('Edge TTS failed, falling back to OpenAI:', error);
      const audio = await generateOpenAITTS(request.text, request.voice);
      return { audio };
    }
  } else if (request.tier === 'openai') {
    const audio = await generateOpenAITTS(request.text, request.voice);
    return { audio };
  } else if (request.tier === 'pro' && request.reference_id) {
    const audio = await generateFishAudio(request.text, request.reference_id);
    return { audio };
  } else if (request.tier === 'aliyun') {
    return await generateAliyunTTS(request.text, request.voice, request.aliyunConfig);
  } else {
    const audio = await generateOpenAITTS(request.text, request.voice);
    return { audio };
  }
}

async function generateEdgeAudioPhysicalAlignment(text: string, voice: string): Promise<TTSResponse> {
  const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  const subtitles: { text: string; startTime: number; endTime: number }[] = [];
  let currentSubtitle = { text: '', startTime: -1, endTime: 0 };

  const audioBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const ws = new WebSocket(EDGE_URL, { headers: EDGE_HEADERS });
    const requestId = uuidv4().replace(/-/g, '');
    const audioChunks: Buffer[] = [];

    ws.on('open', () => {
      const configMsg = `X-Timestamp:${new Date().toString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: "false", // 我们自己用 WordBoundary + 标点来断句
                  wordBoundaryEnabled: "true"
                },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3"
              }
            }
          }
        });
      ws.send(configMsg);

      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${cleanText}</prosody></voice></speak>`;
      const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toString()}\r\nPath:ssml\r\n\r\n` + ssml;
      ws.send(ssmlMsg);
    });

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        const buffer = data as Buffer;
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const headers = buffer.subarray(0, headerEnd).toString();
          if (headers.includes('Path:audio')) {
            const audioData = buffer.subarray(headerEnd + 4);
            audioChunks.push(audioData);
          }
        }
      } else {
        const textData = data.toString();
        if (textData.includes('Path:audio.metadata')) {
          try {
            const jsonStart = textData.indexOf('\r\n\r\n');
            if (jsonStart !== -1) {
              const metadata = JSON.parse(textData.substring(jsonStart + 4));
              if (metadata.Metadata) {
                metadata.Metadata.forEach((meta: any) => {
                  if (meta.Type === 'WordBoundary') {
                    const wordText = meta.Data.text.Text;
                    const timestamp = meta.Data.Offset / 10000000; // 秒
                    const duration = meta.Data.Duration / 10000000;
                    
                    if (currentSubtitle.startTime === -1) currentSubtitle.startTime = timestamp;
                    currentSubtitle.endTime = timestamp + duration;
                    
                    const prefix = currentSubtitle.text ? ' ' : '';
                    currentSubtitle.text += prefix + wordText;

                    // 标点断句核心逻辑：
                    // 检查 wordText 是否以标点结尾
                    if (/[.?!,;。？！，；]$/.test(wordText.trim())) {
                        subtitles.push({ ...currentSubtitle });
                        currentSubtitle = { text: '', startTime: -1, endTime: 0 };
                    }
                  }
                });
              }
            }
          } catch (e) { console.error('Metadata parsing error:', e); }
        }
        if (textData.includes('Path:turn.end')) {
            if (currentSubtitle.text.trim()) {
                subtitles.push({ ...currentSubtitle });
            }
            ws.close();
        }
      }
    });

    ws.on('close', (code, reason) => {
      if (audioChunks.length > 0) {
        const fullBuffer = Buffer.concat(audioChunks);
        resolve(fullBuffer.buffer.slice(fullBuffer.byteOffset, fullBuffer.byteOffset + fullBuffer.byteLength) as ArrayBuffer);
      } else {
         if (cleanText.length === 0) {
             resolve(new ArrayBuffer(0));
             return;
        }
        reject(new Error(`WebSocket closed without audio data. Code: ${code}, Reason: ${reason}`));
      }
    });

    ws.on('error', (err) => reject(err));
  });

  const srtOutput = subtitles.map((s, i) => {
    return `${i + 1}\n${formatSRTTimeFromSeconds(s.startTime)} --> ${formatSRTTimeFromSeconds(s.endTime)}\n${s.text.trim()}\n\n`;
  }).join('');

  console.log('FINAL SRT CONTENT:\n', srtOutput);
  return { audio: audioBuffer, srt: srtOutput };
}

// --- 其他 TTS 实现 ---

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
    if (!apiKey) throw new Error('Edge TTS 失败，且未配置 OpenAI API Key。');
  
    let openaiVoice = voice;
    if (voice === 'male') openaiVoice = 'echo';
    if (voice === 'female') openaiVoice = 'alloy';
    if (!['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(openaiVoice)) {
        openaiVoice = 'alloy';
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: openaiVoice,
      }),
    });
  
    if (!response.ok) {
      throw new Error(`TTS API Error: ${response.statusText}`);
    }
  
    return await response.arrayBuffer();
}

// 阿里云内置字幕的断句逻辑：将词语组合成句子
function formatAliyunTimestampsToSRT(timestamps: any[]): string {
  if (!timestamps || timestamps.length === 0) return '';

  const segments: { text: string; start: number; end: number; wordCount: number }[] = [];
  let currentSegment = { text: '', start: -1, end: 0, wordCount: 0 };

  timestamps.forEach((item) => {
    const word = item.word || item.text || '';
    const start = item.start / 1000;
    const end = item.end / 1000;

    if (currentSegment.start === -1) currentSegment.start = start;

    currentSegment.text += word;
    currentSegment.end = end;
    currentSegment.wordCount++;

    // 遇标点或词数过多则断句
    if (/[，。？！；,;?!]$/.test(word.trim()) || currentSegment.wordCount >= 12) {
      segments.push({ ...currentSegment });
      currentSegment = { text: '', start: -1, end: 0, wordCount: 0 };
    }
  });

  if (currentSegment.text) segments.push(currentSegment);

  return segments
    .map(
      (s, i) =>
        `${i + 1}\n${formatSRTTimeFromSeconds(s.start)} --> ${formatSRTTimeFromSeconds(s.end)}\n${s.text.trim()}\n\n`
    )
    .join('');
}

// --- Aliyun TTS (CosyVoice-v1) SSE 模式 ---
async function generateAliyunTTS(
  text: string,
  voice: string = 'cosyvoice',
  cfg?: { apiKey?: string; voiceId?: string; workspaceId?: string }
): Promise<TTSResponse> {
  const apiKey = cfg?.apiKey || process.env.ALIYUN_API_KEY;
  // 默认音色，确保 voiceId 有效。常见如：longxiaochun, longlaotie, longshuo 等
  const voiceId = cfg?.voiceId || voice || 'longxiaochun'; 
  const workspaceId = cfg?.workspaceId || process.env.ALIYUN_WORKSPACE_ID;

  if (!apiKey) {
    throw new Error('阿里云 TTS 需要 API Key');
  }

  // 标准 DashScope TTS 接口
  const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/text-to-speech';

  // 修正的 Payload - 移除可能导致 400 错误的参数
  // 主要修改：移除了 sample_rate 参数，只保留必需的参数
  const payload = {
    model: 'cosyvoice-v1', // 或者 'cosyvoice-v2'
    input: {
      text: text
    },
    parameters: {
      voice: voiceId,
      format: 'mp3',
      // 注释掉 sample_rate，使用默认值
      // sample_rate: 24000,  // 这个参数可能导致 400 错误
      enable_word_timestamp: true 
    }
  };

  console.log('发送阿里云 TTS 请求:', JSON.stringify(payload, null, 2));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    // 💡 关键：开启 SSE 模式，这样阿里云才会返回包含 Metadata 的流
    'X-DashScope-SSE': 'enable',
    ...(workspaceId && { 'X-DashScope-WorkSpace': workspaceId })
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorDetail = '';
      try {
        const errJson = await res.json();
        errorDetail = JSON.stringify(errJson, null, 2);
      } catch {
        errorDetail = await res.text();
      }
      
      console.error('阿里云 API 详细错误响应:', {
        status: res.status,
        statusText: res.statusText,
        error: errorDetail
      });
      
      throw new Error(`Aliyun TTS Error: ${res.status} - ${errorDetail}`);
    }

    // --- 处理 SSE 流数据 ---
    const reader = res.body?.getReader();
    if (!reader) throw new Error('无法读取阿里云响应流');

    let audioChunks: Buffer[] = [];
    let fullMetadata: any[] = [];
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      const lines = chunkText.split('\n');

      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.replace('data:', '').trim();
            if (!jsonStr) continue;
            const data = JSON.parse(jsonStr);

            if (data.output?.audio_data) {
              audioChunks.push(Buffer.from(data.output.audio_data, 'base64'));
            }

            // 提取时间戳信息
            if (data.output?.timestamps || data.output?.sentence_timestamps || data.output?.word_timestamps) {
               console.log('Detected timestamps in chunk:', JSON.stringify(data.output));
               fullMetadata = data.output.timestamps || data.output.sentence_timestamps || data.output.word_timestamps;
            }
          } catch (e) {
            // 忽略不完整 JSON
            console.warn('SSE 数据解析警告:', e);
          }
        }
      }
    }

    // 合并音频
    const fullAudioBuffer = Buffer.concat(audioChunks);
    const audioArrayBuffer = fullAudioBuffer.buffer.slice(
      fullAudioBuffer.byteOffset,
      fullAudioBuffer.byteOffset + fullAudioBuffer.byteLength
    ) as ArrayBuffer;

    // 生成 SRT（按标点/词数断句）
    let srtOutput: string | undefined;
    if (fullMetadata.length > 0) {
      srtOutput = formatAliyunTimestampsToSRT(fullMetadata);
      console.log('阿里云字幕数据:', fullMetadata);
      console.log('生成的字幕内容:', srtOutput);
    } else {
      console.warn('阿里云 TTS 未返回时间戳数据');
    }

    return { audio: audioArrayBuffer, srt: srtOutput };
    
  } catch (error: any) {
    console.error('阿里云 TTS 请求失败:', error);
    // 用户要求：如果是阿里云失败，直接报错，不要回退到 OpenAI
    throw error;
  }
}