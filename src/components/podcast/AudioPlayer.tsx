import { Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type AudioPlayerProps = { audioElement: HTMLAudioElement | null };

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AudioPlayer = ({ audioElement }: AudioPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!audioElement) {
            return;
        }

        const updateTime = () => setCurrentTime(audioElement.currentTime);
        const updateDuration = () => setDuration(isFinite(audioElement.duration) ? audioElement.duration : 0);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audioElement.addEventListener('timeupdate', updateTime);
        audioElement.addEventListener('loadedmetadata', updateDuration);
        audioElement.addEventListener('durationchange', updateDuration);
        audioElement.addEventListener('ended', handleEnded);
        audioElement.addEventListener('play', handlePlay);
        audioElement.addEventListener('pause', handlePause);

        updateTime();
        updateDuration();
        setIsPlaying(!audioElement.paused);

        return () => {
            audioElement.removeEventListener('timeupdate', updateTime);
            audioElement.removeEventListener('loadedmetadata', updateDuration);
            audioElement.removeEventListener('durationchange', updateDuration);
            audioElement.removeEventListener('ended', handleEnded);
            audioElement.removeEventListener('play', handlePlay);
            audioElement.removeEventListener('pause', handlePause);
        };
    }, [audioElement]);

    const togglePlayPause = async () => {
        if (!audioElement) {
            return;
        }

        if (isPlaying) {
            audioElement.pause();
        } else {
            try {
                audioElement.muted = false;
                audioElement.volume = 1;
                await audioElement.play();
            } catch (err) {
                console.error('Play failed:', err);
            }
        }
    };

    const handleSeek = (value: number[]) => {
        if (!audioElement) {
            return;
        }
        const newTime = value[0];
        audioElement.currentTime = newTime;
        setCurrentTime(newTime);
    };

    return (
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
    );
};
