import { NextRequest, NextResponse } from 'next/server';
import { generateAudio, TTSTier } from '@/utils/tts-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, tier, referenceId, voice, returnSubtitles } = body; 

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

    // Aliyun Keys (BYOK)
    const aliyunApiKey = req.headers.get('x-aliyun-api-key') || undefined;
    const aliyunAkId = req.headers.get('x-aliyun-ak-id') || undefined;
    const aliyunAkSecret = req.headers.get('x-aliyun-ak-secret') || undefined;
    const aliyunVoiceId = req.headers.get('x-aliyun-voice-id') || undefined;

    const result = await generateAudio({
      text,
      tier: tier as TTSTier || 'standard',
      reference_id: referenceId,
      voice: voice,
      returnSubtitles: !!returnSubtitles,
      aliyunConfig: {
        apiKey: aliyunApiKey,
        akId: aliyunAkId,
        akSecret: aliyunAkSecret,
        voiceId: aliyunVoiceId
      }
    });

    if (result.srt) {
      // 如果有 SRT，返回 JSON 格式，包含 Base64 音频和 SRT
      const audioBase64 = Buffer.from(result.audio).toString('base64');
      return NextResponse.json({
        audio: audioBase64,
        srt: result.srt
      });
    } else {
      // 否则直接返回音频流 (保持兼容性)
      return new NextResponse(result.audio, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': result.audio.byteLength.toString(),
        },
      });
    }

  } catch (error: any) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { error: error.message || 'TTS generation failed' },
      { status: 500 }
    );
  }
}
