import { Loader2, Mic, Pause, Play, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Poem } from '@/types/notebook';
import { PODCAST_STYLES, type PodcastStyle, TTS_PLATFORMS, type TTSPlatform } from '@/types/podcast';

type PodcastModalProps = { isOpen: boolean; onClose: () => void; poems: Poem[] };

// Azure Neural Voices - categorized by personality
const AZURE_VOICES = {
    'Energetic & Dynamic': {
        'en-US-EmmaNeural': 'Emma (Female, Energetic)',
        'en-US-JasonNeural': 'Jason (Male, Energetic)',
        'en-US-MichelleNeural': 'Michelle (Female, Dynamic)',
        'en-US-TonyNeural': 'Tony (Male, Dynamic)',
    },
    'Friendly & Warm': {
        'en-US-AriaNeural': 'Aria (Female, Friendly)',
        'en-US-DavisNeural': 'Davis (Male, Warm)',
        'en-US-GuyNeural': 'Guy (Male, Friendly)',
        'en-US-JennyNeural': 'Jenny (Female, Warm)',
    },
    'Professional & Clear': {
        'en-US-AmberNeural': 'Amber (Female, Professional)',
        'en-US-AnaNeural': 'Ana (Female, Clear)',
        'en-US-AndrewNeural': 'Andrew (Male, Professional)',
        'en-US-BrianNeural': 'Brian (Male, Clear)',
    },
    'Thoughtful & Calm': {
        'en-US-EricNeural': 'Eric (Male, Thoughtful)',
        'en-US-NancyNeural': 'Nancy (Female, Calm)',
        'en-US-RogerNeural': 'Roger (Male, Calm)',
        'en-US-SaraNeural': 'Sara (Female, Thoughtful)',
    },
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PodcastModal = ({ isOpen, onClose, poems }: PodcastModalProps) => {
    const [style, setStyle] = useState<PodcastStyle>('expert-analysis');
    const [platform, setPlatform] = useState<TTSPlatform>('azure-speech');
    const [transcript, setTranscript] = useState('');
    const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
    const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);

    // Voice selections
    const [narratorVoice, setNarratorVoice] = useState('en-US-AriaNeural');
    const [alexVoice, setAlexVoice] = useState('en-US-GuyNeural');
    const [jordanVoice, setJordanVoice] = useState('en-US-JennyNeural');

    // Audio player state
    const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null); // keep for imperative refs if you want

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hasAudio, setHasAudio] = useState(false);

    useEffect(() => {
        const audio = audioEl;
        if (!audio) {
            return;
        }

        // Ensure ref is set for other code paths
        audioRef.current = audio;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            toast.info('Podcast finished playing');
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        // if audio is already ready, set initial values
        updateTime();
        updateDuration();
        setIsPlaying(!audio.paused);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [audioEl]); // re-run whenever the audio element changes

    const generateTranscript = async () => {
        setIsGeneratingTranscript(true);
        try {
            const response = await fetch('/api/podcast/transcript', {
                body: JSON.stringify({
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
                    voiceConfig: { alex: alexVoice, jordan: jordanVoice, narrator: narratorVoice },
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
                // audioRef will be set because we render <audio> in the UI (see below)
                toast.error('Audio element not initialized');
                return;
            }

            if (data.audioUrl) {
                audioRef.current.src = data.audioUrl; // or your static path
            } else if (data.audioBase64) {
                audioRef.current.src = `data:audio/mp3;base64,${data.audioBase64}`;
            } else {
                toast.error('No audio data received');
                return;
            }

            audioRef.current.load();

            // wait until it's ready (optional)
            await new Promise((resolve, reject) => {
                if (!audioRef.current) {
                    return reject();
                }
                audioRef.current.addEventListener('canplaythrough', resolve, { once: true });
                audioRef.current.addEventListener('error', reject, { once: true });
            });

            setHasAudio(true);
            toast.success('Podcast generated successfully! Use the player below to listen.');
        } catch (error) {
            console.error('Error generating podcast:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate podcast');
        } finally {
            setIsGeneratingPodcast(false);
        }
    };

    const togglePlayPause = async () => {
        const audio = audioRef.current || audioEl;
        if (!audio) {
            return;
        }

        if (isPlaying) {
            audio.pause();
        } else {
            try {
                audio.muted = false;
                audio.volume = 1;
                await audio.play();
            } catch (err) {
                console.error('Play failed:', err);
                toast.error('Failed to play audio');
            }
        }
    };

    const handleSeek = (value: number[]) => {
        const audio = audioRef.current || audioEl;
        if (!audio) {
            return;
        }
        const newTime = value[0];
        audio.currentTime = newTime;
        setCurrentTime(newTime); // immediate update so UI feels snappy
    };

    const handleClose = () => {
        // Stop and cleanup audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setHasAudio(false);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setTranscript('');
        onClose();
    };

    const isDebateStyle = style === 'debate';

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Generate Podcast Discussion</DialogTitle>
                    <DialogDescription>
                        Create an engaging podcast discussion about your selected poems
                    </DialogDescription>
                </DialogHeader>

                {hasAudio && (
                    <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                        <Label className="font-semibold text-base">Audio Player</Label>

                        <div className="flex items-center gap-4">
                            <ToggleGroup type="single" value={isPlaying ? 'play' : 'pause'}>
                                <ToggleGroupItem value="play" onClick={togglePlayPause} aria-label="Play">
                                    <Play className="h-4 w-4" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="pause" onClick={togglePlayPause} aria-label="Pause">
                                    <Pause className="h-4 w-4" />
                                </ToggleGroupItem>
                            </ToggleGroup>

                            <div className="flex-1 space-y-2">
                                <Slider
                                    value={[currentTime]}
                                    max={duration || 100}
                                    step={0.1}
                                    onValueChange={handleSeek}
                                    className="cursor-pointer"
                                />
                                <div className="flex justify-between text-muted-foreground text-xs">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    <audio
                        ref={(el) => {
                            setAudioEl(el);
                            audioRef.current = el ?? null;
                        }}
                        // optionally keep controls during debugging
                        // controls
                        hidden
                    />
                    <div className="space-y-2">
                        <Label>Selected Poems</Label>
                        <div className="text-muted-foreground text-sm">{poems.map((p) => p.title).join(', ')}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                            <Label htmlFor="platform">TTS Platform</Label>
                            <Select value={platform} onValueChange={(v) => setPlatform(v as TTSPlatform)}>
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

                    {/* Voice Selection Section */}
                    <div className="space-y-3 rounded-lg border p-4">
                        <Label className="font-semibold text-base">Voice Selection</Label>

                        {isDebateStyle ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="alex-voice" className="text-sm">
                                        Alex's Voice
                                    </Label>
                                    <Select value={alexVoice} onValueChange={setAlexVoice}>
                                        <SelectTrigger id="alex-voice">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(AZURE_VOICES).map(([category, voices]) => (
                                                <div key={category}>
                                                    <div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
                                                        {category}
                                                    </div>
                                                    {Object.entries(voices).map(([value, label]) => (
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
                                    <Label htmlFor="jordan-voice" className="text-sm">
                                        Jordan's Voice
                                    </Label>
                                    <Select value={jordanVoice} onValueChange={setJordanVoice}>
                                        <SelectTrigger id="jordan-voice">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(AZURE_VOICES).map(([category, voices]) => (
                                                <div key={category}>
                                                    <div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
                                                        {category}
                                                    </div>
                                                    {Object.entries(voices).map(([value, label]) => (
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
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="narrator-voice" className="text-sm">
                                    Narrator Voice
                                </Label>
                                <Select value={narratorVoice} onValueChange={setNarratorVoice}>
                                    <SelectTrigger id="narrator-voice">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(AZURE_VOICES).map(([category, voices]) => (
                                            <div key={category}>
                                                <div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
                                                    {category}
                                                </div>
                                                {Object.entries(voices).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

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
