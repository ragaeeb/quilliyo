import { useCallback, useEffect, useState } from 'react';

interface NotebookListItem {
    notebookId: string;
    name: string;
    description?: string;
    updatedAt: string;
    createdAt: string;
}

export function useNotebooks() {
    const [notebooks, setNotebooks] = useState<NotebookListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNotebooks = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/notebooks');
            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setNotebooks(data.notebooks);
            }
        } catch (error) {
            console.error('Failed to load notebooks:', error);
            setError('Failed to load notebooks');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotebooks();
    }, [loadNotebooks]);

    const createNotebook = useCallback(
        async (notebookId: string, name: string, description?: string) => {
            try {
                const res = await fetch('/api/notebooks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notebookId, name, description }),
                });

                const data = await res.json();

                if (res.ok) {
                    await loadNotebooks(); // Refresh the list
                    return { success: true, notebook: data.notebook };
                } else {
                    return { success: false, error: data.error };
                }
            } catch (error) {
                console.error('Failed to create notebook:', error);
                return { success: false, error: 'Failed to create notebook' };
            }
        },
        [loadNotebooks],
    );

    const deleteNotebook = useCallback(
        async (notebookId: string) => {
            try {
                const res = await fetch(`/api/notebooks/${notebookId}`, { method: 'DELETE' });

                if (res.ok) {
                    await loadNotebooks(); // Refresh the list
                    return { success: true };
                } else {
                    const data = await res.json();
                    return { success: false, error: data.error };
                }
            } catch (error) {
                console.error('Failed to delete notebook:', error);
                return { success: false, error: 'Failed to delete notebook' };
            }
        },
        [loadNotebooks],
    );

    return { notebooks, isLoading, error, createNotebook, deleteNotebook, refreshNotebooks: loadNotebooks };
}
