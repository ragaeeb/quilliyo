import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useThoughtDrawer } from '@/hooks/useThoughtDrawer';

describe('useThoughtDrawer', () => {
    it('opens for new thought with provided range', () => {
        const { result } = renderHook(() => useThoughtDrawer());

        const range = { start: 0, end: 5, text: 'Hello' };

        act(() => {
            result.current.openForNewThought(range);
        });

        expect(result.current.isDrawerOpen).toBe(true);
        expect(result.current.selectedRange).toEqual(range);
        expect(result.current.currentThought).toBe('');
        expect(result.current.editingThought).toBeNull();
    });

    it('opens for viewing with selected thoughts', () => {
        const { result } = renderHook(() => useThoughtDrawer());
        const range = { start: 2, end: 4, text: 'me' };

        act(() => {
            result.current.openForViewing(['1', '2'], range);
        });

        expect(result.current.viewingThoughtIds).toEqual(['1', '2']);
        expect(result.current.selectedRange).toEqual(range);
        expect(result.current.isDrawerOpen).toBe(true);
    });

    it('supports editing and closing the drawer', () => {
        const { result } = renderHook(() => useThoughtDrawer());
        const thought = { id: '1', text: 'Existing', createdAt: '2024-01-01', startIndex: 0, endIndex: 5, selectedText: 'Hello' };

        act(() => {
            result.current.openForEditing(thought as any);
        });

        expect(result.current.editingThought).toEqual(thought);
        expect(result.current.currentThought).toBe('Existing');

        act(() => {
            result.current.setCurrentThought('Updated');
            result.current.resetForNewThought();
        });

        expect(result.current.currentThought).toBe('');
        expect(result.current.editingThought).toBeNull();

        act(() => {
            result.current.closeDrawer();
        });

        expect(result.current.isDrawerOpen).toBe(false);
        expect(result.current.selectedRange).toBeNull();
        expect(result.current.viewingThoughtIds).toEqual([]);
    });
});
