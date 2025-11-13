import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePoemEditState } from '@/hooks/usePoemEditState';

describe('usePoemEditState', () => {
    const basePoem = {
        id: 'poem-1',
        title: 'Original Title',
        content: 'Original content',
        tags: ['Inspiration'],
        category: 'Reflection',
        chapter: 'Chapter 1',
        metadata: { urls: ['https://example.com'], thoughts: [] },
        createdOn: '2024-01-01T00:00:00Z',
        lastUpdatedOn: '2024-01-02T00:00:00Z',
    };

    it('initialises state from the provided poem', () => {
        const { result } = renderHook(() => usePoemEditState(basePoem as any));

        expect(result.current.title).toBe('Original Title');
        expect(result.current.content).toBe('Original content');
        expect(result.current.poemTags).toEqual(['Inspiration']);
        expect(result.current.urls).toEqual(['https://example.com']);
        expect(result.current.createdOn).toBe('2024-01-01');
        expect(result.current.lastUpdatedOn).toBe('2024-01-02');
    });

    it('allows editing the current poem fields', () => {
        const { result } = renderHook(() => usePoemEditState(basePoem as any));

        act(() => {
            result.current.setTitle('Updated Title');
            result.current.setContent('Updated content');
            result.current.setPoemTags(['Focus']);
            result.current.setCategory('Discipline');
            result.current.setChapter('Chapter 2');
            result.current.setUrls(['https://focus.example']);
            result.current.setCreatedOn('2024-02-01');
            result.current.setLastUpdatedOn('2024-02-03');
            result.current.setFontSize(18);
        });

        expect(result.current.title).toBe('Updated Title');
        expect(result.current.content).toBe('Updated content');
        expect(result.current.poemTags).toEqual(['Focus']);
        expect(result.current.category).toBe('Discipline');
        expect(result.current.chapter).toBe('Chapter 2');
        expect(result.current.urls).toEqual(['https://focus.example']);
        expect(result.current.createdOn).toBe('2024-02-01');
        expect(result.current.lastUpdatedOn).toBe('2024-02-03');
        expect(result.current.fontSize).toBe(18);
    });

    it('resets state when the poem prop changes', () => {
        const { result, rerender } = renderHook(({ poem }) => usePoemEditState(poem as any), {
            initialProps: { poem: basePoem },
        });

        act(() => {
            result.current.setTitle('Local Change');
        });

        const nextPoem = {
            ...basePoem,
            id: 'poem-2',
            title: 'Incoming Title',
            content: 'Incoming content',
            tags: ['Hope'],
            category: 'Optimism',
            chapter: 'Chapter 3',
            metadata: { urls: ['https://new.example'], thoughts: [] },
            createdOn: '2024-03-04T00:00:00Z',
            lastUpdatedOn: '2024-03-05T00:00:00Z',
        };

        rerender({ poem: nextPoem });

        expect(result.current.title).toBe('Incoming Title');
        expect(result.current.content).toBe('Incoming content');
        expect(result.current.poemTags).toEqual(['Hope']);
        expect(result.current.urls).toEqual(['https://new.example']);
        expect(result.current.createdOn).toBe('2024-03-04');
        expect(result.current.lastUpdatedOn).toBe('2024-03-05');
    });
});
