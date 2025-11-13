import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMetadata } from '@/hooks/useMetadata';

describe('useMetadata', () => {
    const samplePoems = [
        {
            id: '1',
            title: 'First',
            content: 'Content',
            tags: ['Love', 'Nature'],
            category: 'Romance',
            chapter: 'Spring',
        },
        {
            id: '2',
            title: 'Second',
            content: 'Content',
            tags: ['love', 'Inspiration'],
            category: 'Inspiration',
            chapter: 'Autumn',
        },
    ];

    it('collects unique metadata values', () => {
        const { result } = renderHook(() => useMetadata(samplePoems as any));

        expect(result.current.allTags).toEqual(['inspiration', 'love', 'nature']);
        expect(result.current.allCategories).toEqual(['Inspiration', 'Romance']);
        expect(result.current.allChapters).toEqual(['Autumn', 'Spring']);
    });

    it('responds to changing poems', () => {
        const { result, rerender } = renderHook(({ poems }) => useMetadata(poems as any), {
            initialProps: { poems: samplePoems },
        });

        expect(result.current.allTags).toContain('love');

        const updatedPoems = [
            { id: '3', title: 'Third', content: 'Another', tags: ['Focus'], category: 'Work', chapter: 'Winter' },
        ];

        rerender({ poems: updatedPoems });

        expect(result.current.allTags).toEqual(['focus']);
        expect(result.current.allCategories).toEqual(['Work']);
        expect(result.current.allChapters).toEqual(['Winter']);
    });
});
