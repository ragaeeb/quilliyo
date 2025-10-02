import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/authMiddleware';
import type { PodcastGenerationRequest } from '@/types/podcast';

const generateWithGeminiTTS = async (transcript: string) => {
    return NextResponse.json(
        { error: 'Google Gemini TTS integration coming soon. Please use Azure Speech for now.' },
        { status: 501 },
    );
};

const generateWithAzureSpeech = async (transcript: string) => {
    const apiKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!apiKey) {
        return NextResponse.json({ error: 'Azure Speech API key not configured' }, { status: 500 });
    }

    try {
        const isDebate = transcript.includes('ALEX:') && transcript.includes('JORDAN:');

        if (isDebate) {
            const segments = parseDebateTranscript(transcript);
            const audioBuffers = [];

            for (const segment of segments) {
                const voice = segment.speaker === 'ALEX' ? 'en-US-GuyNeural' : 'en-US-JennyNeural';
                const ssml = createSSML(segment.text, voice);

                const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                    body: ssml,
                    headers: {
                        'Content-Type': 'application/ssml+xml',
                        'Ocp-Apim-Subscription-Key': apiKey,
                        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
                    },
                    method: 'POST',
                });

                if (!response.ok) {
                    throw new Error(`Azure TTS failed: ${response.statusText}`);
                }

                const buffer = await response.arrayBuffer();
                audioBuffers.push(buffer);
            }

            const combinedBuffer = combineAudioBuffers(audioBuffers);
            const base64Audio = Buffer.from(combinedBuffer).toString('base64');

            return NextResponse.json({ audioBase64: base64Audio });
        } else {
            const ssml = createSSML(transcript, 'en-US-AriaNeural');

            const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                body: ssml,
                headers: {
                    'Content-Type': 'application/ssml+xml',
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
                },
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`Azure TTS failed: ${response.statusText}`);
            }

            const audioBuffer = await response.arrayBuffer();
            const base64Audio = Buffer.from(audioBuffer).toString('base64');

            return NextResponse.json({ audioBase64: base64Audio });
        }
    } catch (error) {
        console.error('Azure TTS error:', error);
        return NextResponse.json({ error: 'Failed to generate audio with Azure' }, { status: 500 });
    }
};

const parseDebateTranscript = (transcript: string) => {
    const lines = transcript.split('\n');
    const segments = [];
    let currentSpeaker = '';
    let currentText = '';

    for (const line of lines) {
        const alexMatch = line.match(/^ALEX:\s*(.+)$/);
        const jordanMatch = line.match(/^JORDAN:\s*(.+)$/);

        if (alexMatch) {
            if (currentSpeaker && currentText) {
                segments.push({ speaker: currentSpeaker, text: currentText.trim() });
            }
            currentSpeaker = 'ALEX';
            currentText = alexMatch[1];
        } else if (jordanMatch) {
            if (currentSpeaker && currentText) {
                segments.push({ speaker: currentSpeaker, text: currentText.trim() });
            }
            currentSpeaker = 'JORDAN';
            currentText = jordanMatch[1];
        } else if (currentSpeaker && line.trim()) {
            currentText += ` ${line.trim()}`;
        }
    }

    if (currentSpeaker && currentText) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
    }

    return segments;
};

const createSSML = (text: string, voice: string) => {
    const processedText = text
        .replace(/\.\.\./g, '<break time="500ms"/>')
        .replace(/--/g, '<break time="300ms"/>')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voice}">
            <prosody rate="0.95" pitch="0%">
                ${processedText}
            </prosody>
        </voice>
    </speak>`;
};

const combineAudioBuffers = (buffers: ArrayBuffer[]) => {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;

    for (const buffer of buffers) {
        combined.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
    }

    return combined.buffer;
};

const handler = async (request: NextRequest) => {
    try {
        const { transcript, platform }: PodcastGenerationRequest = await request.json();

        if (platform === 'google-gemini') {
            return generateWithGeminiTTS(transcript);
        } else {
            return generateWithAzureSpeech(transcript);
        }
    } catch (error) {
        console.error('Error generating podcast:', error);
        return NextResponse.json({ error: 'Failed to generate podcast' }, { status: 500 });
    }
};

export const POST = withAuth(handler);
