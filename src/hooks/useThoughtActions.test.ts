import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useThoughtActions } from './useThoughtActions';

const toastError = vi.fn();

vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args), success: vi.fn() } }));

afterEach(() => {
    toastError.mockClear();
    vi.useRealTimers();
});

describe('useThoughtActions', () => {
    it('prevents saving empty thoughts', () => {
        let thoughts: any[] = [];
        const setThoughts = vi.fn((updater: (prev: any[]) => any[]) => {
            thoughts = updater(thoughts);
        });

        const { result } = renderHook(() => useThoughtActions(thoughts, setThoughts));

        const saved = result.current.saveThought('   ', null, null);

        expect(saved).toBe(false);
        expect(toastError).toHaveBeenCalledWith('Please write a thought');
        expect(thoughts).toHaveLength(0);
    });

    it('updates an existing thought when editing', () => {
        let thoughts = [
            { createdAt: '2024-01-01', endIndex: 5, id: '1', selectedText: 'Hello', startIndex: 0, text: 'Original' },
        ];
        const setThoughts = vi.fn((updater: (prev: any[]) => any[]) => {
            thoughts = updater(thoughts);
        });

        const { result } = renderHook(() => useThoughtActions(thoughts, setThoughts));

        const saved = result.current.saveThought('Updated', thoughts[0], null);

        expect(saved).toBe(true);
        expect(thoughts[0]?.text).toBe('Updated');
    });

    it('creates a new thought from a selection and finds related thoughts', () => {
        vi.useFakeTimers().setSystemTime(new Date('2024-04-01T12:00:00Z'));

        let thoughts: any[] = [];
        const setThoughts = vi.fn((updater: (prev: any[]) => any[]) => {
            thoughts = updater(thoughts);
        });

        const { result, rerender } = renderHook(() => useThoughtActions(thoughts, setThoughts));

        const saved = result.current.saveThought('Fresh idea', null, { end: 5, start: 0, text: 'Hello' });

        expect(saved).toBe(true);
        expect(thoughts).toHaveLength(1);
        expect(thoughts[0]).toMatchObject({
            createdAt: '2024-04-01T12:00:00.000Z',
            endIndex: 5,
            selectedText: 'Hello',
            startIndex: 0,
            text: 'Fresh idea',
        });

        rerender();

        const related = result.current.getRelatedThoughts(thoughts[0]?.id);
        expect(related).toHaveLength(1);
        expect(related[0]?.text).toBe('Fresh idea');
    });

    it('returns empty related thoughts for unknown ids', () => {
        const thoughts = [
            { createdAt: '2024-01-01', endIndex: 5, id: '1', selectedText: 'Hello', startIndex: 0, text: 'Thought' },
        ];
        const setThoughts = vi.fn();

        const { result } = renderHook(() => useThoughtActions(thoughts, setThoughts as any));

        expect(result.current.getRelatedThoughts('unknown')).toEqual([]);
    });
});
