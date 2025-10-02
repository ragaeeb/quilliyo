export type PodcastStyle = 'expert-analysis' | 'debate';
export type TTSPlatform = 'azure-speech' | 'google-gemini';

export const PODCAST_STYLES: Record<PodcastStyle, string> = {
    debate: 'Debate Discussion',
    'expert-analysis': 'Expert Analysis',
};

export const TTS_PLATFORMS: Record<TTSPlatform, string> = {
    'azure-speech': 'Azure Speech',
    'google-gemini': 'Google Gemini (Coming Soon)',
};

export interface TranscriptGenerationRequest {
    poems: Array<{ title: string; content: string; category?: string; tags?: string[] }>;
    style: PodcastStyle;
}

export interface PodcastGenerationRequest {
    transcript: string;
    platform: TTSPlatform;
    voiceConfig?: { narrator?: string; alex?: string; jordan?: string };
}
