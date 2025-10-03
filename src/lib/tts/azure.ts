import type { TranscriptSegment, VoiceConfig } from './utils';
import { mixAudioBuffers } from './utils';

const createSSML = (text: string, voice: string): string => {
    let processedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    processedText = processedText.replace(/\.\.\./g, '<break time="500ms"/>').replace(/--/g, '<break time="300ms"/>');

    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voice}">
            <prosody rate="0.95" pitch="0%">
                ${processedText}
            </prosody>
        </voice>
    </speak>`;
};

export const synthesizeSpeech = async (
    text: string,
    voice: string,
    apiKey: string,
    region: string,
    format: string = 'riff-24khz-16bit-mono-pcm',
): Promise<ArrayBuffer> => {
    const ssml = createSSML(text, voice);

    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        body: ssml,
        headers: {
            'Content-Type': 'application/ssml+xml',
            'Ocp-Apim-Subscription-Key': apiKey,
            'X-Microsoft-OutputFormat': format,
        },
        method: 'POST',
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Azure TTS error:', errorText);
        throw new Error(`Azure TTS failed: ${response.statusText}`);
    }

    return response.arrayBuffer();
};

/**
 * Extract PCM data from WAV file (remove 44-byte header)
 */
const extractPCMFromWAV = (wavBuffer: ArrayBuffer): ArrayBuffer => {
    const wavBytes = new Uint8Array(wavBuffer);
    // WAV header is 44 bytes
    return wavBytes.slice(44).buffer;
};

/**
 * Create WAV header for PCM data
 */
const createWAVHeader = (pcmDataLength: number, sampleRate: number = 24000): ArrayBuffer => {
    const numChannels = 1; // Mono
    const bitsPerSample = 16;

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + pcmDataLength, true); // File size - 8
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
    view.setUint32(40, pcmDataLength, true); // Subchunk2Size

    return wavHeader;
};

export const synthesizeDebateSegments = async (
    segments: TranscriptSegment[],
    voiceConfig: VoiceConfig,
    apiKey: string,
    region: string,
): Promise<ArrayBuffer[]> => {
    console.log('Azure: synthesizeDebateSegments - collecting PCM buffers');

    // Use WAV format for easier processing
    const format = 'riff-24khz-16bit-mono-pcm';
    const pcmBuffers: ArrayBuffer[] = [];
    const overlapGroups = new Map<number, TranscriptSegment[]>();

    // Group segments by overlap
    for (const segment of segments) {
        if (segment.isOverlap && segment.overlapGroup !== undefined) {
            if (!overlapGroups.has(segment.overlapGroup)) {
                overlapGroups.set(segment.overlapGroup, []);
            }
            overlapGroups.get(segment.overlapGroup)!.push(segment);
        }
    }

    // Process segments
    let i = 0;
    while (i < segments.length) {
        const segment = segments[i];

        if (segment.isOverlap && segment.overlapGroup !== undefined) {
            // Find all segments in this overlap group
            const groupSegments = overlapGroups.get(segment.overlapGroup)!;
            const speaker1Segment = groupSegments.find((s) => s.speaker === 'SPEAKER_1');
            const speaker2Segment = groupSegments.find((s) => s.speaker === 'SPEAKER_2');

            if (speaker1Segment && speaker2Segment) {
                // Generate audio for both speakers
                const voice1 = voiceConfig.speaker1 || 'en-US-GuyNeural';
                const voice2 = voiceConfig.speaker2 || 'en-US-JennyNeural';

                console.log(`Azure: Generating overlap group ${segment.overlapGroup}`);

                const [wav1, wav2] = await Promise.all([
                    synthesizeSpeech(speaker1Segment.text, voice1, apiKey, region, format),
                    synthesizeSpeech(speaker2Segment.text, voice2, apiKey, region, format),
                ]);

                // Extract PCM from both WAV files
                const pcm1 = extractPCMFromWAV(wav1);
                const pcm2 = extractPCMFromWAV(wav2);

                // Mix at the PCM level
                const data1 = new Int16Array(pcm1);
                const data2 = new Int16Array(pcm2);
                const maxLength = Math.max(data1.length, data2.length);
                const mixed = new Int16Array(maxLength);

                for (let j = 0; j < maxLength; j++) {
                    const sample1 = j < data1.length ? data1[j] : 0;
                    const sample2 = j < data2.length ? data2[j] : 0;
                    let mixedSample = (sample1 + sample2) / 2;
                    mixedSample = Math.max(-32768, Math.min(32767, mixedSample));
                    mixed[j] = mixedSample;
                }

                pcmBuffers.push(mixed.buffer);
                console.log(`Azure: Mixed overlap group ${segment.overlapGroup}: ${mixed.byteLength} bytes PCM`);
            }

            // Skip all segments in this overlap group
            while (i < segments.length && segments[i].overlapGroup === segment.overlapGroup) {
                i++;
            }
        } else {
            // Regular segment
            const voice =
                segment.speaker === 'SPEAKER_1'
                    ? voiceConfig.speaker1 || 'en-US-GuyNeural'
                    : voiceConfig.speaker2 || 'en-US-JennyNeural';

            const wavBuffer = await synthesizeSpeech(segment.text, voice, apiKey, region, format);
            const pcmBuffer = extractPCMFromWAV(wavBuffer);
            pcmBuffers.push(pcmBuffer);
            console.log(`Azure: Generated segment: ${pcmBuffer.byteLength} bytes PCM`);
            i++;
        }
    }

    console.log(`Azure: Collected ${pcmBuffers.length} PCM segments`);

    // Combine all PCM buffers
    const totalLength = pcmBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const combinedPCM = new Uint8Array(totalLength);
    let offset = 0;

    for (const buffer of pcmBuffers) {
        combinedPCM.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
    }

    console.log(`Azure: Combined PCM data: ${combinedPCM.byteLength} bytes`);

    // Create WAV file with header
    const wavHeader = createWAVHeader(combinedPCM.byteLength);
    const finalWAV = new Uint8Array(44 + combinedPCM.byteLength);
    finalWAV.set(new Uint8Array(wavHeader), 0);
    finalWAV.set(combinedPCM, 44);

    console.log(`Azure: Created final WAV file: ${finalWAV.byteLength} bytes`);

    // Return as a single-element array
    return [finalWAV.buffer];
};
