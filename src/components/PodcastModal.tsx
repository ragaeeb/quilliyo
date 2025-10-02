import { Loader2, Mic, Sparkles } from 'lucide-react';
import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import type { Poem } from '@/types/notebook';
import { PODCAST_STYLES, type PodcastStyle, TTS_PLATFORMS, type TTSPlatform } from '@/types/podcast';

type PodcastModalProps = { isOpen: boolean; onClose: () => void; poems: Poem[] };

export const PodcastModal = ({ isOpen, onClose, poems }: PodcastModalProps) => {
    const [style, setStyle] = useState<PodcastStyle>('expert-analysis');
    const [platform, setPlatform] = useState<TTSPlatform>('google-gemini');
    const [transcript, setTranscript] = useState('');
    const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
    const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);

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
                body: JSON.stringify({ platform, transcript }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to generate podcast');
            }

            const data = await response.json();

            if (data.audioUrl) {
                window.open(data.audioUrl, '_blank');
            } else if (data.audioBase64) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
                audio.play();
            }

            toast.success('Podcast generated successfully');
        } catch (error) {
            console.error('Error generating podcast:', error);
            toast.error('Failed to generate podcast');
        } finally {
            setIsGeneratingPodcast(false);
        }
    };

    const handleClose = () => {
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

                <div className="flex-1 space-y-4 overflow-y-auto py-4">
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
                        Cancel
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
