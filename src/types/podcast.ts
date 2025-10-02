export type PodcastStyle = 'expert-analysis' | 'two-player-debate';
export type TTSPlatform = 'google-gemini' | 'azure-speech';

export type TranscriptGenerationRequest = {
    poems: Array<{ title: string; content: string; tags?: string[]; category?: string }>;
    style: PodcastStyle;
};

export type TranscriptGenerationResponse = { transcript: string; duration: string };

export type PodcastGenerationRequest = { transcript: string; platform: TTSPlatform };

export type PodcastGenerationResponse = { audioUrl?: string; audioBase64?: string; error?: string };

export const PODCAST_STYLES = { 'expert-analysis': 'Expert Analysis', 'two-player-debate': '2 Player Debate' } as const;

export const TTS_PLATFORMS = { 'azure-speech': 'Azure AI Speech', 'google-gemini': 'Google Gemini TTS' } as const;
