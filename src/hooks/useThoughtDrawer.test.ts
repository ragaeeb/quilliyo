import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useThoughtDrawer } from './useThoughtDrawer';

describe('useThoughtDrawer', () => {
    it('opens for new thought with provided range', () => {
        const { result } = renderHook(() => useThoughtDrawer());

        const range = { end: 5, start: 0, text: 'Hello' };

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
        const range = { end: 4, start: 2, text: 'me' };

        act(() => {
            result.current.openForViewing(['1', '2'], range);
        });

        expect(result.current.viewingThoughtIds).toEqual(['1', '2']);
        expect(result.current.selectedRange).toEqual(range);
        expect(result.current.isDrawerOpen).toBe(true);
    });

    it('supports editing and closing the drawer', () => {
        const { result } = renderHook(() => useThoughtDrawer());
        const thought = {
            createdAt: '2024-01-01',
            endIndex: 5,
            id: '1',
            selectedText: 'Hello',
            startIndex: 0,
            text: 'Existing',
        };

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

    it('handles opening for viewing with empty thought IDs', () => {
        const { result } = renderHook(() => useThoughtDrawer());
        const range = { end: 5, start: 0, text: 'Hello' };

        act(() => {
            result.current.openForViewing([], range);
        });

        expect(result.current.viewingThoughtIds).toEqual([]);
        expect(result.current.isDrawerOpen).toBe(true);
    });

    it('handles multiple sequential openForNewThought calls', () => {
        const { result } = renderHook(() => useThoughtDrawer());
        const range1 = { end: 5, start: 0, text: 'First' };
        const range2 = { end: 10, start: 5, text: 'Second' };

        act(() => {
            result.current.openForNewThought(range1);
            result.current.openForNewThought(range2);
        });

        expect(result.current.selectedRange).toEqual(range2);
    });
});
