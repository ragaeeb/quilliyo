export const PODCAST_STYLES = { debate: 'Debate Discussion', 'expert-analysis': 'Expert Analysis' } as const;

export type PodcastStyle = keyof typeof PODCAST_STYLES;

export const TTS_PLATFORMS = { 'azure-speech': 'Azure Speech', 'google-gemini': 'Google Gemini' } as const;

export type TTSPlatform = keyof typeof TTS_PLATFORMS;

export const AI_MODELS = {
    'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite (Faster)',
    'gemini-2.5-pro': 'Gemini 2.5 Pro (Higher Quality)',
} as const;

export type AIModel = keyof typeof AI_MODELS;

// Gemini TTS Voices
export const GEMINI_VOICES = {
    'Energetic & Dynamic': { Orbit: 'Orbit (Neutral, Energetic)', Puck: 'Puck (Male, Playful)' },
    'Narrative & Storytelling': {
        Aoede: 'Aoede (Female, Expressive)',
        Charon: 'Charon (Male, Calm)',
        Fenrir: 'Fenrir (Male, Deep)',
        Kore: 'Kore (Female, Warm)',
    },
} as const;

// Azure Neural Voices
export const AZURE_VOICES = {
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
} as const;

export type VoiceConfig = { speaker1?: string; speaker2?: string; narrator?: string; outputFilePath?: string };

export type TranscriptGenerationRequest = {
    poems: Array<{ title: string; content: string; category?: string; tags?: string[] }>;
    style: PodcastStyle;
    model?: AIModel;
};

export type PodcastGenerationRequest = { transcript: string; platform: TTSPlatform; voiceConfig?: VoiceConfig };
