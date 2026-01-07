import { NextRequest, NextResponse } from 'next/server';
import { generateAudio, TTSTier } from '@/utils/tts-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, tier, referenceId, voice } = body; // 接收 voice 参数

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 设置 API Keys
    const fishKey = req.headers.get('x-fish-api-key');
    if (fishKey) {
      process.env.FISH_AUDIO_API_KEY = fishKey;
    }
    
    const openaiKey = req.headers.get('x-openai-api-key');
    if (openaiKey) {
      process.env.OPENAI_API_KEY = openaiKey;
    }

    const audioBuffer = await generateAudio({
      text,
      tier: tier as TTSTier || 'standard',
      reference_id: referenceId,
      voice: voice, // 传递 voice
    });

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { error: error.message || 'TTS generation failed' },
      { status: 500 }
    );
  }
}
