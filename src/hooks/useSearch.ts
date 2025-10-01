import Fuse from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Poem } from '@/types/notebook';

export function useSearch(poems: Poem[]) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    const filteredPoems = useMemo(() => {
        if (!debouncedSearch) return poems;

        const fuse = new Fuse(poems, {
            keys: ['title', 'content', 'tags', 'category', 'chapter'],
            threshold: 0.3,
            includeScore: true,
        });

        return fuse.search(debouncedSearch).map((result) => result.item);
    }, [poems, debouncedSearch]);

    return { searchQuery, setSearchQuery, filteredPoems };
}
