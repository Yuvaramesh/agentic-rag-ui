// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const apiKey = process.env.ELEVENLABS_API_KEY!;
  const voiceId = "CxUF1MnX2dESXqaELxCQ"; // ✅ Use your selected voice

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey, // ✅ Correct header
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2", // ✅ Supports Tamil
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error("ElevenLabs TTS error:", errorText);
    return new NextResponse(errorText, { status: 500 });
  }

  const audioBuffer = await response.arrayBuffer();

  return new NextResponse(Buffer.from(audioBuffer), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "inline; filename=output.mp3",
    },
  });
}
