import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { JournalEntry } from '@/types';

// 类型定义：Whisper 的单词级时间戳
interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperResponse {
  text: string;
  words?: WhisperWord[];
  segments?: any[];
}

// 配置 Groq 和 OpenAI 客户端
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
};

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

/**
 * 将 Whisper 的 JSON 响应转换为 SRT 格式
 * 核心逻辑：我们希望基于单词级的时间戳来构建字幕。
 * 但 SRT 是基于句子的。所以我们需要将单词重新组合成句子。
 * 或者，如果 Whisper 返回了 segments（句子级），我们优先使用 segments，
 * 并利用 words 进行微调（如果需要）。
 * 
 * 为了“精准”，我们这里直接使用 Whisper 的 segments，因为它们通常已经是通过静音检测分割好的句子。
 * 如果需要更细粒度（如卡拉OK模式），才使用 words。
 * 这里我们使用 segments 生成标准的 SRT。
 */
export function jsonToSRT(data: any): string {
  const segments = data.segments || [];
  
  if (segments.length === 0 && data.words) {
    // 如果没有 segments 只有 words (例如某些 API 模式)，我们需要手动分句
    // 这里简单处理：每 10 个词或者遇到标点符号分一句
    // 这是一个复杂的 NLP 问题，为了简化，我们假设 Whisper Large v3 会返回 segments
    return ''; 
  }

  return segments.map((segment: any, index: number) => {
    const start = formatTimestamp(segment.start);
    const end = formatTimestamp(segment.end);
    const text = segment.text.trim();
    
    return `${index + 1}\n${start} --> ${end}\n${text}\n`;
  }).join('\n');
}

/**
 * 将 Whisper JSON 转换为我们的 JournalEntry 格式
 * 这比 SRT 更适合我们的播放器
 */
export function jsonToJournalEntries(data: any): JournalEntry[] {
  const segments = data.segments || [];
  
  return segments.map((segment: any, index: number) => ({
    id: String(index + 1),
    startTime: segment.start,
    endTime: segment.end,
    englishText: segment.text.trim(),
    chineseText: '', // 默认为空，后续可以加翻译 API
  }));
}

function formatTimestamp(seconds: number): string {
  const date = new Date(0);
  date.setMilliseconds(seconds * 1000);
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  
  return `${hh}:${mm}:${ss},${ms}`;
}

/**
 * 执行转录
 */
export async function transcribeAudio(audioFile: File | Blob): Promise<any> {
  // 优先使用 Groq (速度快，免费额度)
  const groq = getGroqClient();
  
  if (groq) {
    try {
      console.log('Using Groq Whisper...');
      // 注意：Groq SDK 目前可能不支持直接传 File 对象，需要转为 FormData 或其他处理
      // 这里的实现取决于 SDK 版本。通常 API 需要 multipart/form-data
      
      // 由于 SDK 限制，我们可能需要直接 fetch 调用 Groq API
      // 或者在 Server Action 中处理
      throw new Error('Groq 客户端集成暂未完成，转为 OpenAI');
    } catch (e) {
      console.warn('Groq failed, falling back to OpenAI', e);
    }
  }

  // 回退到 OpenAI
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('未配置 Groq 或 OpenAI API Key');
  }

  console.log('Using OpenAI Whisper...');
  const response = await openai.audio.transcriptions.create({
    file: audioFile as any, // OpenAI SDK 类型定义可能需要适配
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word', 'segment'], // 获取单词级精度
  });

  return response;
}



