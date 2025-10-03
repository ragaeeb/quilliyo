import { Loader2, Mic, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AudioPlayer } from '@/components/podcast/AudioPlayer';
import { VoiceSelector } from '@/components/podcast/VoiceSelector';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Poem } from '@/types/notebook';
import {
    AI_MODELS,
    type AIModel,
    PODCAST_STYLES,
    type PodcastStyle,
    TTS_PLATFORMS,
    type TTSPlatform,
} from '@/types/podcast';

type PodcastModalProps = { isOpen: boolean; onClose: () => void; poems: Poem[] };

export const PodcastModal = ({ isOpen, onClose, poems }: PodcastModalProps) => {
    const [style, setStyle] = useState<PodcastStyle>('expert-analysis');
    const [platform, setPlatform] = useState<TTSPlatform>('azure-speech');
    const [aiModel, setAiModel] = useState<AIModel>('gemini-2.5-flash-lite');
    const [transcript, setTranscript] = useState('');
    const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
    const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);

    // Voice selections - using generic names
    const [narratorVoice, setNarratorVoice] = useState(platform === 'google-gemini' ? 'Aoede' : 'en-US-AriaNeural');
    const [speaker1Voice, setSpeaker1Voice] = useState(platform === 'google-gemini' ? 'Puck' : 'en-US-GuyNeural');
    const [speaker2Voice, setSpeaker2Voice] = useState(platform === 'google-gemini' ? 'Charon' : 'en-US-JennyNeural');

    const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [hasAudio, setHasAudio] = useState(false);

    // Update default voices when platform changes
    const handlePlatformChange = (newPlatform: TTSPlatform) => {
        setPlatform(newPlatform);
        if (newPlatform === 'google-gemini') {
            setNarratorVoice('Aoede');
            setSpeaker1Voice('Puck');
            setSpeaker2Voice('Charon');
        } else {
            setNarratorVoice('en-US-AriaNeural');
            setSpeaker1Voice('en-US-GuyNeural');
            setSpeaker2Voice('en-US-JennyNeural');
        }
    };

    const generateTranscript = async () => {
        setIsGeneratingTranscript(true);
        try {
            const response = await fetch('/api/podcast/transcript', {
                body: JSON.stringify({
                    model: aiModel,
                    poems: poems.map((p) => ({
                        category: p.category,
                        content: p.content,
                        tags: p.tags,
                        title: p.title,
                    })),
                    style,
                }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to generate transcript');
            }

            const data = await response.json();
            setTranscript(data.transcript);
            toast.success('Transcript generated successfully');
        } catch (error) {
            console.error('Error generating transcript:', error);
            toast.error('Failed to generate transcript');
        } finally {
            setIsGeneratingTranscript(false);
        }
    };

    const generatePodcast = async () => {
        if (!transcript) {
            toast.error('Please generate a transcript first');
            return;
        }

        setIsGeneratingPodcast(true);
        try {
            const response = await fetch('/api/podcast/generate', {
                body: JSON.stringify({
                    platform,
                    transcript,
                    voiceConfig: { narrator: narratorVoice, speaker1: speaker1Voice, speaker2: speaker2Voice },
                }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate podcast');
            }

            const data = await response.json();

            if (data.error) {
                toast.error(data.error);
                return;
            }

            if (!audioRef.current) {
                toast.error('Audio element not initialized');
                return;
            }

            if (data.audioUrl) {
                audioRef.current.src = data.audioUrl;
            } else if (data.audioBase64) {
                audioRef.current.src = `data:audio/mp3;base64,${data.audioBase64}`;
            } else {
                toast.error('No audio data received');
                return;
            }

            audioRef.current.load();

            await new Promise((resolve, reject) => {
                if (!audioRef.current) {
                    return reject();
                }
                audioRef.current.addEventListener('canplaythrough', resolve, { once: true });
                audioRef.current.addEventListener('error', reject, { once: true });
            });

            setHasAudio(true);
            toast.success('Podcast generated successfully!');
        } catch (error) {
            console.error('Error generating podcast:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate podcast');
        } finally {
            setIsGeneratingPodcast(false);
        }
    };

    const handleClose = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setHasAudio(false);
        setTranscript('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Generate Podcast Discussion</DialogTitle>
                    <DialogDescription>
                        Create an engaging podcast discussion about your selected poems
                    </DialogDescription>
                </DialogHeader>

                {hasAudio && <AudioPlayer audioElement={audioEl} />}

                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    <audio
                        ref={(el) => {
                            setAudioEl(el);
                            audioRef.current = el;
                        }}
                        hidden
                    >
                        <track kind="captions" />
                    </audio>

                    <div className="space-y-2">
                        <Label>Selected Poems</Label>
                        <div className="text-muted-foreground text-sm">{poems.map((p) => p.title).join(', ')}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="style">Podcast Style</Label>
                            <Select value={style} onValueChange={(v) => setStyle(v as PodcastStyle)}>
                                <SelectTrigger id="style">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PODCAST_STYLES).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ai-model">AI Model</Label>
                            <Select value={aiModel} onValueChange={(v) => setAiModel(v as AIModel)}>
                                <SelectTrigger id="ai-model">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(AI_MODELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="platform">TTS Platform</Label>
                            <Select value={platform} onValueChange={(v) => handlePlatformChange(v as TTSPlatform)}>
                                <SelectTrigger id="platform">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(TTS_PLATFORMS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <VoiceSelector
                        style={style}
                        platform={platform}
                        narratorVoice={narratorVoice}
                        speaker1Voice={speaker1Voice}
                        speaker2Voice={speaker2Voice}
                        onNarratorChange={setNarratorVoice}
                        onSpeaker1Change={setSpeaker1Voice}
                        onSpeaker2Change={setSpeaker2Voice}
                    />

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="transcript">Transcript</Label>
                            {!transcript && (
                                <Button onClick={generateTranscript} disabled={isGeneratingTranscript} size="sm">
                                    {isGeneratingTranscript ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate Transcript
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                        <Textarea
                            id="transcript"
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Click 'Generate Transcript' to create a podcast script..."
                            className="min-h-[300px] font-mono text-sm"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                    <Button onClick={generatePodcast} disabled={!transcript || isGeneratingPodcast}>
                        {isGeneratingPodcast ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Mic className="mr-2 h-4 w-4" />
                                Generate Podcast
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
