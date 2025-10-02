import { createUserContent, GoogleGenAI } from '@google/genai';
import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/authMiddleware';
import type { TranscriptGenerationRequest } from '@/types/podcast';

const generateExpertAnalysisPrompt = (poems: TranscriptGenerationRequest['poems']) => {
    const poemTexts = poems.map((p) => `Title: "${p.title}"\n${p.content}`).join('\n\n---\n\n');

    return `You are an expert poetry analyst hosting a podcast. Create a natural, engaging 10-minute podcast transcript analyzing the following poem(s). 

The transcript should:
- Start with a warm introduction
- Provide deep analysis of metaphors, themes, and writing style
- Point out interesting literary devices
- Discuss the emotional impact and meaning
- Include natural speech patterns, pauses (indicated with "..."), and emphasis
- Sound conversational and engaging, not academic
- End with thoughtful conclusions

Format the transcript as a continuous monologue with natural speaking rhythm.

Poems to analyze:
${poemTexts}

Generate the complete transcript:`;
};

const generateDebatePrompt = (poems: TranscriptGenerationRequest['poems']) => {
    const poemTexts = poems.map((p) => `Title: "${p.title}"\n${p.content}`).join('\n\n---\n\n');

    return `Create a natural, engaging 10-minute podcast transcript featuring two expert poetry analysts (Alex and Jordan) debating the following poem(s).

The transcript should:
- Start with both hosts introducing themselves and the topic
- Feature genuine disagreement on interpretation of themes, metaphors, or meaning
- Include interruptions, agreements, and respectful challenges
- Have natural back-and-forth dialogue with personality
- Include moments of discovery and changing perspectives
- End with each summarizing their position

Format as:
ALEX: [dialogue]
JORDAN: [dialogue]

Use "..." for pauses, and include natural speech patterns.

Poems to debate:
${poemTexts}

Generate the complete transcript:`;
};

const handler = async (request: NextRequest) => {
    try {
        const { poems, style }: TranscriptGenerationRequest = await request.json();

        const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
        const prompt = style === 'expert-analysis' ? generateExpertAnalysisPrompt(poems) : generateDebatePrompt(poems);

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
