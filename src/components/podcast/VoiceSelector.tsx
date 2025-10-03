import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AZURE_VOICES, GEMINI_VOICES, type PodcastStyle, type TTSPlatform } from '@/types/podcast';

type VoiceSelectorProps = {
    style: PodcastStyle;
    platform: TTSPlatform;
    narratorVoice: string;
    speaker1Voice: string;
    speaker2Voice: string;
    onNarratorChange: (voice: string) => void;
    onSpeaker1Change: (voice: string) => void;
    onSpeaker2Change: (voice: string) => void;
};

export const VoiceSelector = ({
    style,
    platform,
    narratorVoice,
    speaker1Voice,
    speaker2Voice,
    onNarratorChange,
    onSpeaker1Change,
    onSpeaker2Change,
}: VoiceSelectorProps) => {
    const isDebateStyle = style === 'debate';
    const voices = platform === 'google-gemini' ? GEMINI_VOICES : AZURE_VOICES;

    if (isDebateStyle) {
        return (
            <div className="space-y-3 rounded-lg border p-4">
                <Label className="font-semibold text-base">Voice Selection</Label>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="speaker1-voice" className="text-sm">
                            First Speaker's Voice
                        </Label>
                        <Select value={speaker1Voice} onValueChange={onSpeaker1Change}>
                            <SelectTrigger id="speaker1-voice">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(voices).map(([category, voiceOptions]) => (
                                    <div key={category}>
                                        <div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
                                            {category}
                                        </div>
                                        {Object.entries(voiceOptions).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="speaker2-voice" className="text-sm">
                            Second Speaker's Voice
                        </Label>
                        <Select value={speaker2Voice} onValueChange={onSpeaker2Change}>
                            <SelectTrigger id="speaker2-voice">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(voices).map(([category, voiceOptions]) => (
                                    <div key={category}>
                                        <div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
                                            {category}
                                        </div>
                                        {Object.entries(voiceOptions).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <Label className="font-semibold text-base">Voice Selection</Label>

            <div className="space-y-2">
                <Label htmlFor="narrator-voice" className="text-sm">
                    Narrator Voice
                </Label>
                <Select value={narratorVoice} onValueChange={onNarratorChange}>
                    <SelectTrigger id="narrator-voice">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(voices).map(([category, voiceOptions]) => (
                            <div key={category}>
                                <div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
                                    {category}
                                </div>
                                {Object.entries(voiceOptions).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </div>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
