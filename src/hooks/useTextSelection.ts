import { useCallback } from 'react';

export function useTextSelection(contentEditableRef: React.RefObject<HTMLDivElement | null>) {
    const getSelectedRange = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !contentEditableRef.current) {
            return null;
        }

        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();

        if (!selectedText || selectedText.trim() === '') {
            return null;
        }

        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(contentEditableRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;
        const end = start + selectedText.length;

        return { end, start, text: selectedText };
    }, [contentEditableRef]);

    return { getSelectedRange };
}
