import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSearch } from './useSearch';

describe('useSearch', () => {
    const poems = [
        {
            category: 'Morning',
            chapter: 'Daybreak',
            content: 'The sun rises',
            id: '1',
            tags: ['Nature'],
            title: 'Sunrise',
        },
        {
            category: 'Evening',
            chapter: 'Dusk',
            content: 'The night comes',
            id: '2',
            tags: ['Nature'],
            title: 'Nightfall',
        },
    ];

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns all poems when there is no search query', () => {
        const { result } = renderHook(() => useSearch(poems as any));
        expect(result.current.filteredPoems).toHaveLength(2);
        expect(result.current.searchQuery).toBe('');
    });

    it('debounces search updates and filters results', async () => {
        vi.useFakeTimers();

        const { result } = renderHook(() => useSearch(poems as any));

        act(() => {
            result.current.setSearchQuery('sun');
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current.filteredPoems).toHaveLength(1);
        expect(result.current.filteredPoems[0]?.id).toBe('1');
        expect(result.current.searchQuery).toBe('sun');

        act(() => {
            result.current.setSearchQuery('');
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current.filteredPoems).toHaveLength(2);
    });
});
