import type { TranscriptSegment, VoiceConfig } from './utils';

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
): Promise<ArrayBuffer> => {
    const ssml = createSSML(text, voice);

    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        body: ssml,
        headers: {
            'Content-Type': 'application/ssml+xml',
            'Ocp-Apim-Subscription-Key': apiKey,
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
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

export const synthesizeDebateSegments = async (
    segments: TranscriptSegment[],
    voiceConfig: VoiceConfig,
    apiKey: string,
    region: string,
): Promise<ArrayBuffer[]> => {
    const audioBuffers: ArrayBuffer[] = [];

    for (const segment of segments) {
        const voice =
            segment.speaker === 'SPEAKER_1'
                ? voiceConfig.speaker1 || 'en-US-GuyNeural'
                : voiceConfig.speaker2 || 'en-US-JennyNeural';

        const buffer = await synthesizeSpeech(segment.text, voice, apiKey, region);
        audioBuffers.push(buffer);
    }

    return audioBuffers;
};
