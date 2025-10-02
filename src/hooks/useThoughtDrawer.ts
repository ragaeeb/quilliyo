import { useCallback, useState } from 'react';
import type { Thought } from '@/types/notebook';

export function useThoughtDrawer() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [currentThought, setCurrentThought] = useState('');
    const [selectedRange, setSelectedRange] = useState<{ start: number; end: number; text: string } | null>(null);
    const [editingThought, setEditingThought] = useState<Thought | null>(null);
    const [viewingThoughtIds, setViewingThoughtIds] = useState<string[]>([]);

    const openForNewThought = useCallback((range: { start: number; end: number; text: string }) => {
        setSelectedRange(range);
        setCurrentThought('');
        setEditingThought(null);
        setViewingThoughtIds([]);
        setIsDrawerOpen(true);
    }, []);

    const openForViewing = useCallback((thoughtIds: string[], range: { start: number; end: number; text: string }) => {
        setViewingThoughtIds(thoughtIds);
        setEditingThought(null);
        setCurrentThought('');
        setSelectedRange(range);
        setIsDrawerOpen(true);
    }, []);

    const openForEditing = useCallback((thought: Thought) => {
        setEditingThought(thought);
        setCurrentThought(thought.text);
        setViewingThoughtIds([]);
    }, []);

    const resetForNewThought = useCallback(() => {
        setCurrentThought('');
        setEditingThought(null);
        setViewingThoughtIds([]);
    }, []);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
        setCurrentThought('');
        setSelectedRange(null);
        setEditingThought(null);
        setViewingThoughtIds([]);
    }, []);

    return {
        closeDrawer,
        currentThought,
        editingThought,
        isDrawerOpen,
        openForEditing,
        openForNewThought,
        openForViewing,
        resetForNewThought,
        selectedRange,
        setCurrentThought,
        setIsDrawerOpen,
        viewingThoughtIds,
    };
}
