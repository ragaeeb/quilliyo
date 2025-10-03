import { createUserContent, GoogleGenAI } from '@google/genai';
import type { TranscriptSegment, VoiceConfig } from './utils';

type TTSModels = 'gemini-2.5-flash-preview-tts' | 'gemini-2.5-pro-preview-tts';

export const synthesizeSpeech = async (
    text: string,
    voiceName: string,
    apiKey: string,
    model?: TTSModels,
): Promise<ArrayBuffer> => {
    const client = new GoogleGenAI({ apiKey });
    console.log('list models', await client.models.list());

    const result = await client.models.generateContent({
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
        contents: createUserContent([text]),
        model: model || 'gemini-2.5-flash-preview-tts',
    });

    // Extract audio data from response
    const audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
        throw new Error('No audio data received from Gemini');
    }

    return Buffer.from(audioData, 'base64').buffer;
};

export const synthesizeDebateSegments = async (
    segments: TranscriptSegment[],
    voiceConfig: VoiceConfig,
    apiKey: string,
): Promise<ArrayBuffer[]> => {
    const audioBuffers: ArrayBuffer[] = [];

    for (const segment of segments) {
        const voiceName =
            segment.speaker === 'SPEAKER_1' ? voiceConfig.speaker1 || 'Puck' : voiceConfig.speaker2 || 'Charon';

        const buffer = await synthesizeSpeech(segment.text, voiceName, apiKey);
        audioBuffers.push(buffer);
    }

    return audioBuffers;
};
