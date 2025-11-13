import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSearch } from '@/hooks/useSearch';

describe('useSearch', () => {
    const poems = [
        { id: '1', title: 'Sunrise', content: 'The sun rises', tags: ['Nature'], category: 'Morning', chapter: 'Daybreak' },
        { id: '2', title: 'Nightfall', content: 'The night comes', tags: ['Nature'], category: 'Evening', chapter: 'Dusk' },
    ];

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns all poems when there is no search query', () => {
        const { result } = renderHook(() => useSearch(poems as any));
        expect(result.current.filteredPoems).toHaveLength(2);
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

        act(() => {
            result.current.setSearchQuery('');
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current.filteredPoems).toHaveLength(2);
    });
});
