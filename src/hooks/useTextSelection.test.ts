import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTextSelection } from './useTextSelection';

describe('useTextSelection', () => {
    it('returns the currently selected text range', () => {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        div.textContent = 'Hello world';
        document.body.appendChild(div);

        const range = document.createRange();
        range.setStart(div.firstChild as ChildNode, 0);
        range.setEnd(div.firstChild as ChildNode, 5);

        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        const { result } = renderHook(() => useTextSelection({ current: div }));

        expect(result.current.getSelectedRange()).toEqual({ end: 5, start: 0, text: 'Hello' });

        selection?.removeAllRanges();
        document.body.removeChild(div);
    });

    it('returns null when there is no valid selection', () => {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        div.textContent = 'Hello world';

        const { result } = renderHook(() => useTextSelection({ current: div }));

        expect(result.current.getSelectedRange()).toBeNull();
    });
});
