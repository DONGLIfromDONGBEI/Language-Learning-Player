import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { jsonToJournalEntries, jsonToSRT } from '@/utils/transcribe-service';

// 配置 OpenAI (这里我们直接在 Route 中初始化，以便从 headers 或 env 获取 key)
// 实际生产中，Key 应该从环境变量获取，或者通过设置面板传入并存储在 Cookie/Header 中
// 为了安全，我们优先检查环境变量

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // 确定使用哪个 Key
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 401 });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    console.log('Transcribing file:', file.name, 'Size:', file.size);

    // 调用 Whisper API
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'], // 我们主要需要句级时间戳来生成 SRT
    });

    // 转换格式
    const srt = jsonToSRT(response);
    const journalData = jsonToJournalEntries(response);

    return NextResponse.json({
      srt,
      journalData,
      raw: response
    });

  } catch (error: any) {
    console.error('Transcription Error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}





