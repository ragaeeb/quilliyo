import { useCallback, useEffect, useState } from 'react';
import type { PoemRevision, RevisionListItem } from '@/types/notebook';

export function useRevisions(poemId: string | null, notebookId = 'default') {
    const [revisions, setRevisions] = useState<RevisionListItem[]>([]);
    const [selectedRevision, setSelectedRevision] = useState<PoemRevision | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load revision list
    const loadRevisions = useCallback(async () => {
        if (!poemId) {
            setRevisions([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ notebookId, poemId });
            const res = await fetch(`/api/revisions?${params}`);
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setRevisions(data.revisions || []);
        } catch (err) {
            console.error('Failed to load revisions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load revisions');
            setRevisions([]);
        } finally {
            setIsLoading(false);
        }
    }, [poemId, notebookId]);

    // Load a specific revision
    const loadRevision = useCallback(
        async (revisionNumber: number) => {
            if (!poemId) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({ notebookId, poemId, revisionNumber: revisionNumber.toString() });
                const res = await fetch(`/api/revisions?${params}`);

                if (!res.ok) {
                    throw new Error(`Failed to load revision: ${res.statusText}`);
                }

                const data = await res.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                setSelectedRevision(data.revision);
            } catch (err) {
                console.error('Failed to load revision:', err);
                setError(err instanceof Error ? err.message : 'Failed to load revision');
                setSelectedRevision(null);
            } finally {
                setIsLoading(false);
            }
        },
        [poemId, notebookId],
    );

    // Load revisions when poemId changes
    useEffect(() => {
        loadRevisions();
    }, [loadRevisions]);

    const clearSelectedRevision = useCallback(() => {
        setSelectedRevision(null);
    }, []);

    return { clearSelectedRevision, error, isLoading, loadRevision, loadRevisions, revisions, selectedRevision };
}
