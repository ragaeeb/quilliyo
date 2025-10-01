import { useCallback, useEffect, useState } from 'react';
import type { Notebook, Poem } from '@/types/notebook';

export function useNotebook(notebookId: string) {
    const [notebook, setNotebook] = useState<Notebook>({ poems: [] });
    const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [showEncryptionDialog, setShowEncryptionDialog] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadNotebook = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const headers: HeadersInit = {};
                if (encryptionKey) {
                    headers['x-encryption-key'] = encryptionKey;
                }

                const res = await fetch(`/api/notebooks/${notebookId}`, { headers });

                if (res.status === 404) {
                    setError('Notebook not found');
                    setIsLoading(false);
                    return;
                }

                const data = await res.json();

                if (data.error) {
                    if (data.error === 'Invalid encryption key') {
                        alert('Invalid encryption key');
                        setEncryptionKey(null);
                    } else {
                        setError(data.error);
                    }
                    setIsLoading(false);
                    return;
                }

                if (data.encrypted) {
                    setIsEncrypted(true);
                    setShowEncryptionDialog(true);
                    setIsLoading(false);
                    return;
                }

                setNotebook(data);
                setIsEncrypted(false);
            } catch (error) {
                console.error('Failed to load notebook:', error);
                setError('Failed to load notebook');
            } finally {
                setIsLoading(false);
            }
        };

        loadNotebook();
    }, [encryptionKey, notebookId]);

    const saveNotebook = useCallback(async () => {
        try {
            const res = await fetch(`/api/notebooks/${notebookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: notebook, encryptionKey }),
            });
            const result = await res.json();
            if (result.success) {
                setLastSaved(result.timestamp);
            }
        } catch (error) {
            console.error('Failed to save:', error);
        }
    }, [notebook, encryptionKey, notebookId]);

    const handleSavePoem = useCallback((poem: Poem) => {
        setNotebook((prev) => {
            const index = prev.poems.findIndex((p) => p.id === poem.id);
            const newPoems = [...prev.poems];
            if (index >= 0) {
                newPoems[index] = poem;
            } else {
                newPoems.push(poem);
            }
            return { ...prev, poems: newPoems };
        });
    }, []);

    const deletePoems = useCallback((ids: Set<string>) => {
        setNotebook((prev) => ({ ...prev, poems: prev.poems.filter((p) => !ids.has(p.id)) }));
    }, []);

    const handleEncryptionKeySet = useCallback((key: string) => {
        setEncryptionKey(key);
        setIsEncrypted(!!key);
    }, []);

    const toggleEncryption = useCallback(() => {
        if (encryptionKey) {
            setEncryptionKey(null);
            setIsEncrypted(false);
        } else {
            setShowEncryptionDialog(true);
        }
    }, [encryptionKey]);

    return {
        notebook,
        encryptionKey,
        isEncrypted,
        showEncryptionDialog,
        setShowEncryptionDialog,
        lastSaved,
        isLoading,
        error,
        saveNotebook,
        handleSavePoem,
        deletePoems,
        handleEncryptionKeySet,
        toggleEncryption,
    };
}
