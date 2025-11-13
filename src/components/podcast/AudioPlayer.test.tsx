import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AudioPlayer } from '@/components/podcast/AudioPlayer';

class FakeAudio extends EventTarget {
    currentTime = 0;
    duration = 0;
    paused = true;
    muted = false;
    volume = 1;
    play = vi.fn().mockImplementation(async () => {
        this.paused = false;
        this.dispatchEvent(new Event('play'));
    });
    pause = vi.fn().mockImplementation(() => {
        this.paused = true;
        this.dispatchEvent(new Event('pause'));
    });
}

describe('AudioPlayer', () => {
    it('renders playback progress from the audio element events', async () => {
        const audio = new FakeAudio() as unknown as HTMLAudioElement;

        render(<AudioPlayer audioElement={audio} />);

        act(() => {
            (audio as any).duration = 125;
            audio.dispatchEvent(new Event('loadedmetadata'));
            (audio as any).currentTime = 42;
            audio.dispatchEvent(new Event('timeupdate'));
        });

        expect(await screen.findByText('0:42')).toBeInTheDocument();
        expect(screen.getByText('2:05')).toBeInTheDocument();
    });

    it('plays and pauses audio when buttons are clicked', async () => {
        const user = userEvent.setup();
        const audio = new FakeAudio() as unknown as HTMLAudioElement;

        render(<AudioPlayer audioElement={audio} />);

        const playButton = screen.getByRole('radio', { name: 'Play' });
        await user.click(playButton);

        expect((audio as any).muted).toBe(false);
        expect((audio as any).volume).toBe(1);
        expect((audio as any).play).toHaveBeenCalled();

        const pauseButton = screen.getByRole('radio', { name: 'Pause' });
        await user.click(pauseButton);

        expect((audio as any).pause).toHaveBeenCalled();
    });

    it('resets playback when the audio ends', () => {
        const audio = new FakeAudio() as unknown as HTMLAudioElement;
        render(<AudioPlayer audioElement={audio} />);

        act(() => {
            (audio as any).currentTime = 60;
            audio.dispatchEvent(new Event('timeupdate'));
        });

        expect(screen.getByText('1:00')).toBeInTheDocument();

        act(() => {
            audio.dispatchEvent(new Event('ended'));
        });

        const times = screen.getAllByText('0:00');
        expect(times).toHaveLength(2);
        expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0');
    });
});
