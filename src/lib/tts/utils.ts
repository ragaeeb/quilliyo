import * as fs from 'node:fs';
import * as path from 'node:path';

export type VoiceConfig = { speaker1?: string; speaker2?: string; narrator?: string; outputFilePath?: string };

export type TranscriptSegment = {
    speaker: 'SPEAKER_1' | 'SPEAKER_2';
    text: string;
    isOverlap?: boolean;
    overlapGroup?: number;
};

export const bufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return Buffer.from(binary, 'binary').toString('base64');
};

export const combineAudioBuffers = (buffers: ArrayBuffer[]): ArrayBuffer => {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const combined = new Uint8Array(totalLength);

    let offset = 0;
    for (const buffer of buffers) {
        combined.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
    }

    return combined.buffer;
};

/**
 * Mix two audio buffers by averaging their samples
 * Assumes both are WAV files with the same format
 */
export const mixAudioBuffers = (buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBuffer => {
    const bytes1 = new Uint8Array(buffer1);
    const bytes2 = new Uint8Array(buffer2);

    // WAV header is 44 bytes
    const headerSize = 44;

    // Extract headers (use the first buffer's header)
    const header = bytes1.slice(0, headerSize);

    // Extract audio data
    const data1 = new Int16Array(buffer1, headerSize);
    const data2 = new Int16Array(buffer2, headerSize);

    // Use the longer buffer as the base length
    const maxLength = Math.max(data1.length, data2.length);
    const mixed = new Int16Array(maxLength);

    // Mix the audio samples
    for (let i = 0; i < maxLength; i++) {
        const sample1 = i < data1.length ? data1[i] : 0;
        const sample2 = i < data2.length ? data2[i] : 0;

        // Average the samples and clamp to prevent clipping
        let mixedSample = (sample1 + sample2) / 2;
        mixedSample = Math.max(-32768, Math.min(32767, mixedSample));
        mixed[i] = mixedSample;
    }

    // Combine header and mixed data
    const result = new Uint8Array(headerSize + mixed.byteLength);
    result.set(header, 0);
    result.set(new Uint8Array(mixed.buffer), headerSize);

    // Update the data size in the header
    const view = new DataView(result.buffer);
    view.setUint32(40, mixed.byteLength, true); // data chunk size
    view.setUint32(4, 36 + mixed.byteLength, true); // file size - 8

    return result.buffer;
};

export const isDebateTranscript = (transcript: string): boolean => {
    return transcript.includes('SPEAKER_1:') || transcript.includes('SPEAKER_2:');
};

export const isHeatedDebateTranscript = (transcript: string): boolean => {
    return transcript.includes('[OVERLAP_START]');
};

export const parseDebateTranscript = (transcript: string): TranscriptSegment[] => {
    const segments: TranscriptSegment[] = [];
    const lines = transcript
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    let inOverlap = false;
    let currentOverlapGroup = 0;
    const overlapBuffer: TranscriptSegment[] = [];

    for (const line of lines) {
        if (line === '[OVERLAP_START]') {
            inOverlap = true;
            currentOverlapGroup++;
            continue;
        }

        if (line === '[OVERLAP_END]') {
            inOverlap = false;
            // Add all overlapping segments
            segments.push(...overlapBuffer);
            overlapBuffer.length = 0;
            continue;
        }

        if (line.startsWith('SPEAKER_1:')) {
            const text = line.replace('SPEAKER_1:', '').trim();
            if (text) {
                const segment: TranscriptSegment = {
                    isOverlap: inOverlap,
                    overlapGroup: inOverlap ? currentOverlapGroup : undefined,
                    speaker: 'SPEAKER_1',
                    text,
                };

                if (inOverlap) {
                    overlapBuffer.push(segment);
                } else {
                    segments.push(segment);
                }
            }
        } else if (line.startsWith('SPEAKER_2:')) {
            const text = line.replace('SPEAKER_2:', '').trim();
            if (text) {
                const segment: TranscriptSegment = {
                    isOverlap: inOverlap,
                    overlapGroup: inOverlap ? currentOverlapGroup : undefined,
                    speaker: 'SPEAKER_2',
                    text,
                };

                if (inOverlap) {
                    overlapBuffer.push(segment);
                } else {
                    segments.push(segment);
                }
            }
        }
    }

    return segments;
};

export const saveAudioToFile = async (audioBuffer: ArrayBuffer, filePath: string): Promise<void> => {
    const outputDir = path.dirname(filePath);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(filePath, Buffer.from(audioBuffer));
};
