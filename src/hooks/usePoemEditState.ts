import { useEffect, useState } from 'react';
import type { Poem, Thought } from '@/types/notebook';

export function usePoemEditState(poem: Poem | null) {
    const [content, setContent] = useState(poem?.content || '');
    const [title, setTitle] = useState(poem?.title || '');
    const [showRevisions, setShowRevisions] = useState(false);
    const [poemTags, setPoemTags] = useState<string[]>(poem?.tags || []);
    const [category, setCategory] = useState(poem?.category || '');
    const [chapter, setChapter] = useState(poem?.chapter || '');
    const [urls, setUrls] = useState<string[]>(poem?.metadata?.urls || []);
    const [thoughts, setThoughts] = useState<Thought[]>(poem?.metadata?.thoughts || []);
    const [createdOn, setCreatedOn] = useState(
        poem?.createdOn ? new Date(poem.createdOn).toISOString().split('T')[0] : '',
    );
    const [lastUpdatedOn, setLastUpdatedOn] = useState(
        poem?.lastUpdatedOn ? new Date(poem.lastUpdatedOn).toISOString().split('T')[0] : '',
    );
    const [fontSize, setFontSize] = useState(14);

    useEffect(() => {
        setContent(poem?.content || '');
        setTitle(poem?.title || '');
        setPoemTags(poem?.tags || []);
        setCategory(poem?.category || '');
        setChapter(poem?.chapter || '');
        setUrls(poem?.metadata?.urls || []);
        setThoughts(poem?.metadata?.thoughts || []);
        setCreatedOn(poem?.createdOn ? new Date(poem.createdOn).toISOString().split('T')[0] : '');
        setLastUpdatedOn(poem?.lastUpdatedOn ? new Date(poem.lastUpdatedOn).toISOString().split('T')[0] : '');
    }, [poem]);

    return {
        category,
        chapter,
        content,
        createdOn,
        fontSize,
        lastUpdatedOn,
        poemTags,
        setCategory,
        setChapter,
        setContent,
        setCreatedOn,
        setFontSize,
        setLastUpdatedOn,
        setPoemTags,
        setShowRevisions,
        setThoughts,
        setTitle,
        setUrls,
        showRevisions,
        thoughts,
        title,
        urls,
    };
}
