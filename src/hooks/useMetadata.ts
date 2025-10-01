import { useMemo } from 'react';
import type { Poem } from '@/types/notebook';

export function useMetadata(poems: Poem[]) {
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        poems.forEach((p) => {
            p.tags?.forEach((t) => tags.add(t.toLowerCase()));
        });
        return Array.from(tags).sort();
    }, [poems]);

    const allCategories = useMemo(() => {
        const cats = new Set<string>();
        poems.forEach((p) => p.category && cats.add(p.category));
        return Array.from(cats).sort();
    }, [poems]);

    const allChapters = useMemo(() => {
        const chaps = new Set<string>();
        poems.forEach((p) => p.chapter && chaps.add(p.chapter));
        return Array.from(chaps).sort();
    }, [poems]);

    return { allTags, allCategories, allChapters };
}
