import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type VoiceConfig = { speaker1?: string; speaker2?: string; narrator?: string; outputFilePath?: string };

export type TranscriptSegment = { speaker: string; text: string };

export const parseDebateTranscript = (transcript: string): TranscriptSegment[] => {
    const lines = transcript.split('\n');
    const segments: TranscriptSegment[] = [];
    let currentSpeaker = '';
    let currentText = '';

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            continue;
        }

        const speaker1Match = trimmedLine.match(/^SPEAKER_1:\s*(.*)$/i);
        const speaker2Match = trimmedLine.match(/^SPEAKER_2:\s*(.*)$/i);

        if (speaker1Match) {
            if (currentSpeaker && currentText.trim()) {
                segments.push({ speaker: currentSpeaker, text: currentText.trim() });
            }
            currentSpeaker = 'SPEAKER_1';
            currentText = speaker1Match[1] || '';
        } else if (speaker2Match) {
            if (currentSpeaker && currentText.trim()) {
                segments.push({ speaker: currentSpeaker, text: currentText.trim() });
            }
            currentSpeaker = 'SPEAKER_2';
            currentText = speaker2Match[1] || '';
        } else if (currentSpeaker) {
            currentText += ` ${trimmedLine}`;
        }
    }

    if (currentSpeaker && currentText.trim()) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
    }

    console.log(`Parsed ${segments.length} segments from transcript`);
    return segments;
};

export const isDebateTranscript = (transcript: string): boolean => {
    return transcript.includes('SPEAKER_1:') && transcript.includes('SPEAKER_2:');
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

export const saveAudioToFile = async (audioBuffer: ArrayBuffer, outputPath: string): Promise<void> => {
    const filePath = join(process.cwd(), outputPath);
    await writeFile(filePath, Buffer.from(audioBuffer));
    console.log(`Saved podcast to: ${filePath}`);
};

export const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return Buffer.from(buffer).toString('base64');
};
