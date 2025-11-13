import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PodcastModal } from './PodcastModal';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/components/podcast/AudioPlayer', () => ({
    AudioPlayer: ({ audioElement }: { audioElement: HTMLAudioElement | null }) => (
        <div data-testid="audio-player">{audioElement ? 'with-audio' : 'no-audio'}</div>
    ),
}));

vi.mock('@/components/podcast/VoiceSelector', () => ({
    VoiceSelector: ({ narratorVoice, onNarratorChange }: any) => (
        <div>
            <div data-testid="voice-selector">Narrator: {narratorVoice}</div>
            <button type="button" onClick={() => onNarratorChange('updated-narrator')}>
                Mock Change Voice
            </button>
        </div>
    ),
}));

describe('PodcastModal', () => {
    const poems = [{ category: 'Cat', content: 'Content', id: '1', tags: ['tag'], title: 'Poem One' }];

    const setup = (overrides: Partial<ComponentProps<typeof PodcastModal>> = {}) => {
        const onClose = vi.fn();
        const utils = render(<PodcastModal isOpen onClose={onClose} poems={poems as any} {...overrides} />);
        return { onClose, ...utils };
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it('updates default voices when platform changes', async () => {
        const user = userEvent.setup();
        setup();

        expect(screen.getByTestId('voice-selector')).toHaveTextContent('en-US-AriaNeural');

        const platformTrigger = screen.getByRole('combobox', { name: 'TTS Platform' });
        await user.click(platformTrigger);
        const geminiOption = await screen.findByRole('option', { name: 'Google Gemini' });
        await user.click(geminiOption);

        await waitFor(() => expect(screen.getByTestId('voice-selector')).toHaveTextContent('aoede'));
    });

    it('generates a transcript successfully', async () => {
        const user = userEvent.setup();
        const fetchMock = vi
            .fn()
            .mockResolvedValue({ json: () => Promise.resolve({ transcript: 'Generated transcript' }), ok: true });
        global.fetch = fetchMock as unknown as typeof fetch;

        setup();

        const button = screen.getByRole('button', { name: /Generate Transcript/i });
        await user.click(button);

        await waitFor(() =>
            expect(fetchMock).toHaveBeenCalledWith(
                '/api/podcast/transcript',
                expect.objectContaining({ body: expect.stringContaining('"title":"Poem One"'), method: 'POST' }),
            ),
        );

        expect(toast.success).toHaveBeenCalledWith('Transcript generated successfully');
        expect(screen.getByRole('textbox', { name: 'Transcript' })).toHaveValue('Generated transcript');
    });

    it('handles transcript generation errors', async () => {
        const user = userEvent.setup();
        const fetchMock = vi.fn().mockResolvedValue({ ok: false });
        global.fetch = fetchMock as unknown as typeof fetch;

        setup();

        const button = screen.getByRole('button', { name: /Generate Transcript/i });
        await user.click(button);

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to generate transcript'));
    });

    it('requires a transcript before generating a podcast', async () => {
        const user = userEvent.setup();
        const fetchMock = vi.fn();
        global.fetch = fetchMock as unknown as typeof fetch;

        setup();

        const button = screen.getByRole('button', { name: /Generate Podcast/i });
        expect(button).toBeDisabled();

        await user.click(button);

        expect(toast.error).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('generates podcast audio and exposes the player', async () => {
        const user = userEvent.setup();
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({ json: () => Promise.resolve({ transcript: 'Generated transcript' }), ok: true })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ audioBase64: 'YmFzZTY0' }), ok: true });
        global.fetch = fetchMock as unknown as typeof fetch;

        setup();

        await user.click(screen.getByRole('button', { name: /Generate Transcript/i }));
        await waitFor(() =>
            expect(screen.getByRole('textbox', { name: 'Transcript' })).toHaveValue('Generated transcript'),
        );

        const generatePodcast = screen.getByRole('button', { name: /Generate Podcast/i });
        await user.click(generatePodcast);

        const audioEl = document.querySelector('audio');
        expect(audioEl).toBeTruthy();

        act(() => {
            audioEl?.dispatchEvent(new Event('canplaythrough'));
        });

        await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Podcast generated successfully!'));
        expect(screen.getByTestId('audio-player')).toHaveTextContent('with-audio');
    });

    it('resets and closes when the dialog is dismissed', async () => {
        const user = userEvent.setup();
        global.fetch = vi.fn() as unknown as typeof fetch;

        const { onClose } = setup();

        const closeButtons = screen.getAllByRole('button', { name: 'Close' });
        const footerButton =
            closeButtons.find((button) => button.closest('[data-slot="dialog-footer"]')) ?? closeButtons[0];
        await user.click(footerButton);

        expect(onClose).toHaveBeenCalled();
        expect(screen.getByRole('textbox', { name: 'Transcript' })).toHaveValue('');
    });
});
