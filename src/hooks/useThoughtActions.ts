import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Thought } from '@/types/notebook';

export function useThoughtActions(thoughts: Thought[], setThoughts: (updater: (prev: Thought[]) => Thought[]) => void) {
    const saveThought = useCallback(
        (
            currentThought: string,
            editingThought: Thought | null,
            selectedRange: { start: number; end: number; text: string } | null,
        ) => {
            if (!currentThought.trim()) {
                toast.error('Please write a thought');
                return false;
            }

            if (editingThought) {
                setThoughts((prev) =>
                    prev.map((t) => (t.id === editingThought.id ? { ...t, text: currentThought } : t)),
                );
            } else if (selectedRange) {
                const newThought: Thought = {
                    createdAt: new Date().toISOString(),
                    endIndex: selectedRange.end,
                    id: Date.now().toString(),
                    selectedText: selectedRange.text,
                    startIndex: selectedRange.start,
                    text: currentThought,
                };
                setThoughts((prev) => [...prev, newThought]);
            }

            return true;
        },
        [setThoughts],
    );

    const deleteThought = useCallback(
        (thoughtId: string) => {
            setThoughts((prev) => prev.filter((t) => t.id !== thoughtId));
        },
        [setThoughts],
    );

    const getRelatedThoughts = useCallback(
        (thoughtId: string) => {
            const clickedThought = thoughts.find((t) => t.id === thoughtId);
            if (!clickedThought) {
                return [];
            }

            return thoughts.filter(
                (t) =>
                    t.selectedText === clickedThought.selectedText &&
                    t.startIndex === clickedThought.startIndex &&
                    t.endIndex === clickedThought.endIndex,
            );
        },
        [thoughts],
    );

    return { deleteThought, getRelatedThoughts, saveThought };
}
