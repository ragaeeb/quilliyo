import { type NextRequest, NextResponse } from 'next/server';
import { getNextKey } from '@/lib/apiKeyManager';
import { withAuth } from '@/lib/middleware/authMiddleware';
import * as AzureTTS from '@/lib/tts/azure';
import * as GeminiTTS from '@/lib/tts/gemini';
import {
    bufferToBase64,
    combineAudioBuffers,
    isDebateTranscript,
    parseDebateTranscript,
    saveAudioToFile,
    type VoiceConfig,
} from '@/lib/tts/utils';
import type { PodcastGenerationRequest } from '@/types/podcast';

const generateWithAzureSpeech = async (transcript: string, voiceConfig?: VoiceConfig) => {
    const apiKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!apiKey) {
        return NextResponse.json({ error: 'Azure Speech API key not configured' }, { status: 500 });
    }

    try {
        const isDebate = isDebateTranscript(transcript);
        let audioBuffer: ArrayBuffer;

        if (isDebate) {
            const segments = parseDebateTranscript(transcript);
            if (segments.length === 0) {
                return NextResponse.json({ error: 'Failed to parse debate transcript' }, { status: 500 });
            }

            const audioBuffers = await AzureTTS.synthesizeDebateSegments(segments, voiceConfig || {}, apiKey, region);
            audioBuffer = combineAudioBuffers(audioBuffers);
        } else {
            const voice = voiceConfig?.narrator || 'en-US-AriaNeural';
            audioBuffer = await AzureTTS.synthesizeSpeech(transcript, voice, apiKey, region);
        }

        if (voiceConfig?.outputFilePath) {
            await saveAudioToFile(audioBuffer, voiceConfig.outputFilePath);
        }

        return NextResponse.json({ audioBase64: bufferToBase64(audioBuffer) });
    } catch (error) {
        console.error('Azure TTS error:', error);
        return NextResponse.json({ error: 'Failed to generate audio with Azure' }, { status: 500 });
    }
};

const generateWithGeminiTTS = async (transcript: string, voiceConfig?: VoiceConfig) => {
    try {
        const isDebate = isDebateTranscript(transcript);
        let audioBuffer: ArrayBuffer;

        if (isDebate) {
            const segments = parseDebateTranscript(transcript);
            if (segments.length === 0) {
                return NextResponse.json({ error: 'Failed to parse debate transcript' }, { status: 500 });
            }

            const audioBuffers = await GeminiTTS.synthesizeDebateSegments(segments, voiceConfig || {});
            audioBuffer = combineAudioBuffers(audioBuffers);
        } else {
            const voiceName = voiceConfig?.narrator || 'aoede';
            audioBuffer = await GeminiTTS.synthesizeSpeech(transcript, voiceName, getNextKey());
        }

        if (voiceConfig?.outputFilePath) {
            await saveAudioToFile(audioBuffer, voiceConfig.outputFilePath);
        }

        return NextResponse.json({ audioBase64: bufferToBase64(audioBuffer) });
    } catch (error) {
        console.error('Gemini TTS error:', error);
        return NextResponse.json({ error: 'Failed to generate audio with Gemini' }, { status: 500 });
    }
};

const handler = async (request: NextRequest) => {
    try {
        const { transcript, platform, voiceConfig }: PodcastGenerationRequest = await request.json();

        if (platform === 'google-gemini') {
            console.log('Generating podcast with Gemini');
            return generateWithGeminiTTS(transcript, { ...voiceConfig, outputFilePath: 'output.mp3' });
        }
        return generateWithAzureSpeech(transcript, voiceConfig);
    } catch (error) {
        console.error('Error generating podcast:', error);
        return NextResponse.json({ error: 'Failed to generate podcast' }, { status: 500 });
    }
};

export const POST = withAuth(handler);
