import { createUserContent, GoogleGenAI } from '@google/genai';
import type { TranscriptSegment, VoiceConfig } from './utils';

type TTSModels = 'gemini-2.5-flash-preview-tts' | 'gemini-2.5-pro-preview-tts';

/**
 * Convert raw PCM audio data to WAV format
 * Gemini returns 24kHz, 16-bit, mono PCM audio
 */
const pcmToWav = (pcmData: ArrayBuffer): ArrayBuffer => {
    const pcmBytes = new Uint8Array(pcmData);
    const sampleRate = 24000; // Gemini's output sample rate
    const numChannels = 1; // Mono
    const bitsPerSample = 16;

    // WAV header is 44 bytes
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + pcmBytes.length, true); // File size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true); // ByteRate
    view.setUint16(32, (numChannels * bitsPerSample) / 8, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample

    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, pcmBytes.length, true); // Subchunk2Size

    // Combine header and PCM data
    const wavData = new Uint8Array(44 + pcmBytes.length);
    wavData.set(new Uint8Array(wavHeader), 0);
    wavData.set(pcmBytes, 44);

    return wavData.buffer;
};

export const synthesizeSpeech = async (
    text: string,
    voiceName: string,
    apiKey: string,
    model?: TTSModels,
): Promise<ArrayBuffer> => {
    const client = new GoogleGenAI({ apiKey });

    console.log('Generating audio with voice', voiceName, 'model', model);
    const result = await client.models.generateContent({
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
        contents: createUserContent([text]),
        model: model || 'gemini-2.5-flash-preview-tts',
    });

    console.log('Content received');

    // Extract audio data from response
    const audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
        throw new Error('No audio data received from Gemini');
    }

    // Convert base64 PCM to ArrayBuffer, then to WAV
    const pcmBuffer = Buffer.from(audioData, 'base64').buffer;
    const wavBuffer = pcmToWav(pcmBuffer);

    console.log(`Converted PCM (${pcmBuffer.byteLength} bytes) to WAV (${wavBuffer.byteLength} bytes)`);

    return wavBuffer;
};

export const synthesizeDebateSegments = async (
    segments: TranscriptSegment[],
    voiceConfig: VoiceConfig,
    apiKey: string,
): Promise<ArrayBuffer[]> => {
    const audioBuffers: ArrayBuffer[] = [];

    console.log('synthesizeDebateSegments');
    for (const segment of segments) {
        const voiceName =
            segment.speaker === 'SPEAKER_1' ? voiceConfig.speaker1 || 'puck' : voiceConfig.speaker2 || 'charon';

        const buffer = await synthesizeSpeech(segment.text, voiceName, apiKey);
        audioBuffers.push(buffer);
    }

    console.log('Finished with total', audioBuffers.length);

    return audioBuffers;
};
