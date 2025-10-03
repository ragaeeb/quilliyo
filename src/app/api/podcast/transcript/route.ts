import { createUserContent, GoogleGenAI } from '@google/genai';
import { type NextRequest, NextResponse } from 'next/server';
import { getNextKey } from '@/lib/apiKeyManager';
import { withAuth } from '@/lib/middleware/authMiddleware';
import type { TranscriptGenerationRequest } from '@/types/podcast';

const generateExpertAnalysisPrompt = (poems: TranscriptGenerationRequest['poems']) => {
    const poemTexts = poems.map((p) => `Title: "${p.title}"\n${p.content}`).join('\n\n---\n\n');

    return `You are an expert poetry analyst hosting a podcast. Create a natural, engaging 10-minute podcast transcript analyzing the following poem(s). 

CRITICAL REQUIREMENTS:
- DO NOT mention any music, sound effects, intro music, outro music, or background sounds
- DO NOT include stage directions like [music fades], [intro music], or [outro]
- Start directly with your spoken introduction
- The transcript should ONLY contain the words you will speak

The transcript should:
- Start with a warm spoken introduction
- Provide deep analysis of metaphors, themes, and writing style
- Point out interesting literary devices
- Discuss the emotional impact and meaning
- Include natural speech patterns, pauses (indicated with "..."), and emphasis
- Sound conversational and engaging, not academic
- End with thoughtful spoken conclusions

Format the transcript as a continuous monologue with natural speaking rhythm. ONLY include spoken words - no music cues or sound effect descriptions.

Poems to analyze:
${poemTexts}

Generate the complete transcript:`;
};

const generateDebatePrompt = (poems: TranscriptGenerationRequest['poems']) => {
    const poemTexts = poems.map((p) => `Title: "${p.title}"\n${p.content}`).join('\n\n---\n\n');

    return `Create a natural, engaging 10-minute podcast transcript featuring two expert poetry analysts (SPEAKER_1 and SPEAKER_2) debating the following poem(s).

CRITICAL REQUIREMENTS:
- DO NOT mention any music, sound effects, intro music, outro music, or background sounds
- DO NOT include stage directions like [music fades], [intro music], or [outro]
- Start directly with the speakers talking
- The transcript should ONLY contain the words the speakers will say

The transcript should:
- Start with both hosts introducing themselves and the topic (spoken words only)
- Feature genuine disagreement on interpretation of themes, metaphors, or meaning
- Include interruptions, agreements, and respectful challenges
- Have natural back-and-forth dialogue with personality
- Include moments of discovery and changing perspectives
- End with each summarizing their position (spoken words only)

Format as:
SPEAKER_1: [their spoken dialogue]
SPEAKER_2: [their spoken dialogue]

Use "..." for pauses, and include natural speech patterns. ONLY include spoken words - no music cues or sound effect descriptions.

Poems to debate:
${poemTexts}

Generate the complete transcript:`;
};

const generateHeatedDebatePrompt = (poems: TranscriptGenerationRequest['poems']) => {
    const poemTexts = poems.map((p) => `Title: "${p.title}"\n${p.content}`).join('\n\n---\n\n');

    return `Create a natural, engaging 10-minute podcast transcript featuring two passionate poetry analysts (SPEAKER_1 and SPEAKER_2) in a HEATED DEBATE about the following poem(s).

CRITICAL REQUIREMENTS:
- DO NOT mention any music, sound effects, intro music, outro music, or background sounds
- DO NOT include stage directions like [music fades], [intro music], or [outro]
- Start directly with the speakers talking
- The transcript should ONLY contain the words the speakers will say
- When speakers talk over each other, use the format:
  [OVERLAP_START]
  SPEAKER_1: [their words during overlap]
  SPEAKER_2: [their words during overlap]
  [OVERLAP_END]

The transcript should:
- Start with both hosts introducing themselves, already showing tension
- Feature STRONG disagreement with passionate, emotional language
- Include 3-5 moments where they talk over each other (marked with [OVERLAP_START] and [OVERLAP_END])
- Show frustration, excitement, and intensity in their arguments
- Include interruptions mid-sentence (use "--" to show cut-offs)
- Have rapid back-and-forth exchanges where tensions escalate
- Feature moments where they interrupt or challenge each other aggressively
- End with both still disagreeing but having exhausted their main points

OVERLAP RULES:
- Overlapping sections should be 1-2 sentences per speaker
- Make the overlap feel natural - one speaker might be finishing a point while the other jumps in
- During overlaps, both speakers should be making different points simultaneously
- Use overlaps strategically during the most heated moments

Format as:
SPEAKER_1: [their spoken dialogue]
SPEAKER_2: [their spoken dialogue]
[OVERLAP_START]
SPEAKER_1: [words during overlap]
SPEAKER_2: [words during overlap]
[OVERLAP_END]
SPEAKER_1: [continuing after overlap]

Use "..." for pauses, "--" for interruptions, and include passionate, intense speech patterns. ONLY include spoken words - no music cues or sound effect descriptions.

Poems to debate:
${poemTexts}

Generate the complete transcript:`;
};

const handler = async (request: NextRequest) => {
    try {
        const { poems, style }: TranscriptGenerationRequest = await request.json();

        const client = new GoogleGenAI({ apiKey: getNextKey() });

        let prompt: string;
        if (style === 'expert-analysis') {
            prompt = generateExpertAnalysisPrompt(poems);
        } else if (style === 'heated-debate') {
            prompt = generateHeatedDebatePrompt(poems);
        } else {
            prompt = generateDebatePrompt(poems);
        }

        const result = await client.models.generateContent({
            config: { maxOutputTokens: 4096, temperature: 0.8 },
            contents: createUserContent([prompt]),
            model: 'gemini-2.5-flash-lite',
        });

        const transcript = result.text;

        return NextResponse.json({ duration: '10:00', transcript });
    } catch (error) {
        console.error('Error generating transcript:', error);
        return NextResponse.json({ error: 'Failed to generate transcript' }, { status: 500 });
    }
};

export const POST = withAuth(handler);
