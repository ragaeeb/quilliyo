export const PODCAST_STYLES = {
    debate: 'Debate Discussion',
    'expert-analysis': 'Expert Analysis',
    'heated-debate': 'Heated Debate',
} as const;

export type PodcastStyle = keyof typeof PODCAST_STYLES;

export const TTS_PLATFORMS = { 'azure-speech': 'Azure Speech', 'google-gemini': 'Google Gemini' } as const;

export type TTSPlatform = keyof typeof TTS_PLATFORMS;

export const AI_MODELS = {
    'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite (Faster)',
    'gemini-2.5-pro': 'Gemini 2.5 Pro (Higher Quality)',
} as const;

export type AIModel = keyof typeof AI_MODELS;

// Gemini TTS Voices (all lowercase as required by API)
export const GEMINI_VOICES = {
    'Additional Voices': {
        achernar: 'Achernar',
        achird: 'Achird',
        algenib: 'Algenib',
        algieba: 'Algieba',
        alnilam: 'Alnilam',
        autonoe: 'Autonoe',
        callirrhoe: 'Callirrhoe',
        enceladus: 'Enceladus',
        erinome: 'Erinome',
        gacrux: 'Gacrux',
        iapetus: 'Iapetus',
        laomedeia: 'Laomedeia',
        pulcherrima: 'Pulcherrima',
        rasalgethi: 'Rasalgethi',
        sadachbia: 'Sadachbia',
        sadaltager: 'Sadaltager',
        schedar: 'Schedar',
        sulafat: 'Sulafat',
        vindemiatrix: 'Vindemiatrix',
        zephyr: 'Zephyr',
        zubenelgenubi: 'Zubenelgenubi',
    },
    'Calm & Professional': { charon: 'Charon (Calm)', despina: 'Despina (Gentle)', umbriel: 'Umbriel (Smooth)' },
    'Expressive & Dynamic': { fenrir: 'Fenrir (Deep)', orus: 'Orus (Energetic)', puck: 'Puck (Playful)' },
    'Warm & Narrative': { aoede: 'Aoede (Expressive)', kore: 'Kore (Warm)', leda: 'Leda (Friendly)' },
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
