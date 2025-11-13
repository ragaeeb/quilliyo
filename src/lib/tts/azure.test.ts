import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as azureModule from './azure';

declare global {
    // eslint-disable-next-line no-var
    var fetch: typeof globalThis.fetch;
}

const { synthesizeDebateSegments, synthesizeSpeech } = azureModule;

describe('synthesizeSpeech', () => {
    const fetchMock = vi.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        fetchMock.mockReset();
        global.fetch = originalFetch;
    });

    it('should call Azure TTS endpoint and return audio buffer', async () => {
        const arrayBuffer = new ArrayBuffer(8);
        fetchMock.mockResolvedValueOnce({
            arrayBuffer: () => Promise.resolve(arrayBuffer),
            ok: true,
        });

        const result = await synthesizeSpeech('Hello & goodbye... -- pause', 'en-US-Test', 'api-key', 'westus');

        expect(fetchMock).toHaveBeenCalledWith(
            'https://westus.tts.speech.microsoft.com/cognitiveservices/v1',
            expect.objectContaining({
                body: expect.stringContaining('&amp;'),
                headers: expect.objectContaining({
                    'Content-Type': 'application/ssml+xml',
                    'Ocp-Apim-Subscription-Key': 'api-key',
                    'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
                }),
                method: 'POST',
            }),
        );
        const body = fetchMock.mock.calls[0][1]?.body as string;
        expect(body).toContain('<break time="500ms"/>');
        expect(body).toContain('<break time="300ms"/>');
        expect(result).toBe(arrayBuffer);
    });

    it('should throw when the API responds with an error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        fetchMock.mockResolvedValueOnce({
            ok: false,
            statusText: 'Unauthorized',
            text: () => Promise.resolve('invalid key'),
        });

        await expect(
            synthesizeSpeech('Hello', 'en-US-Test', 'bad-key', 'westus'),
        ).rejects.toThrowError('Azure TTS failed: Unauthorized');

        expect(consoleSpy).toHaveBeenCalledWith('Azure TTS error:', 'invalid key');
        consoleSpy.mockRestore();
    });
});

describe('synthesizeDebateSegments', () => {
    const createFakeWav = (samples: number[]) => {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const pcm = new Int16Array(buffer, 44, samples.length);
        pcm.set(samples);
        return buffer;
    };

    it('should generate combined WAV output for overlapping and sequential segments', async () => {
        const originalFetch = global.fetch;
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(createFakeWav([1000, -1000])) })
            .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(createFakeWav([2000, 2000])) })
            .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(createFakeWav([4000, -4000])) })
            .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(createFakeWav([1234])) });
        global.fetch = fetchMock as unknown as typeof fetch;

        const segments = [
            { text: 'Intro', speaker: 'SPEAKER_1', isOverlap: false },
            { text: 'Overlap A', speaker: 'SPEAKER_1', isOverlap: true, overlapGroup: 1 },
            { text: 'Overlap B', speaker: 'SPEAKER_2', isOverlap: true, overlapGroup: 1 },
            { text: 'Outro', speaker: 'SPEAKER_2', isOverlap: false },
        ];

        const voiceConfig = { speaker1: 'voice-1', speaker2: 'voice-2' };
        try {
            const result = await synthesizeDebateSegments(segments as any, voiceConfig as any, 'key', 'region');

            expect(fetchMock).toHaveBeenCalledTimes(4);
            const wavBytes = new Uint8Array(result[0]);
            expect(wavBytes.byteLength).toBe(54);
            const pcmView = new Int16Array(result[0], 44);
            expect([...pcmView]).toEqual([1000, -1000, 3000, -1000, 1234]);
        } finally {
            global.fetch = originalFetch;
        }
    });
});
