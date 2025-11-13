import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VoiceSelector } from '@/components/podcast/VoiceSelector';

describe('VoiceSelector', () => {
    it('renders narrator selection for non-debate styles', async () => {
        const user = userEvent.setup();
        const onNarratorChange = vi.fn();

        render(
            <VoiceSelector
                style="expert-analysis"
                platform="azure-speech"
                narratorVoice="en-US-AriaNeural"
                speaker1Voice="en-US-GuyNeural"
                speaker2Voice="en-US-JennyNeural"
                onNarratorChange={onNarratorChange}
                onSpeaker1Change={vi.fn()}
                onSpeaker2Change={vi.fn()}
            />,
        );

        expect(screen.getByText('Voice Selection')).toBeInTheDocument();
        expect(screen.queryByText("First Speaker's Voice")).not.toBeInTheDocument();

        const narratorTrigger = screen.getByRole('combobox');
        await user.click(narratorTrigger);

        const option = await screen.findByRole('option', { name: 'Davis (Male, Warm)' });
        await user.click(option);

        expect(onNarratorChange).toHaveBeenCalledWith('en-US-DavisNeural');
    });

    it('renders separate speaker selections for debate styles', async () => {
        const user = userEvent.setup();
        const onSpeaker1Change = vi.fn();
        const onSpeaker2Change = vi.fn();

        render(
            <VoiceSelector
                style="debate"
                platform="azure-speech"
                narratorVoice="en-US-AriaNeural"
                speaker1Voice="en-US-GuyNeural"
                speaker2Voice="en-US-JennyNeural"
                onNarratorChange={vi.fn()}
                onSpeaker1Change={onSpeaker1Change}
                onSpeaker2Change={onSpeaker2Change}
            />,
        );

        expect(screen.getByText("First Speaker's Voice")).toBeInTheDocument();
        expect(screen.getByText("Second Speaker's Voice")).toBeInTheDocument();

        const [speaker1Trigger, speaker2Trigger] = screen.getAllByRole('combobox');

        await user.click(speaker1Trigger);
        const speakerOption = await screen.findByRole('option', { name: 'Davis (Male, Warm)' });
        await user.click(speakerOption);
        expect(onSpeaker1Change).toHaveBeenCalledWith('en-US-DavisNeural');

        await user.click(speaker2Trigger);
        const secondOption = await screen.findByRole('option', { name: 'Tony (Male, Dynamic)' });
        await user.click(secondOption);
        expect(onSpeaker2Change).toHaveBeenCalledWith('en-US-TonyNeural');
    });
});
