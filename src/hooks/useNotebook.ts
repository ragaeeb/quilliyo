import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Notebook, Poem } from '@/types/notebook';

export function useNotebook() {
    const [notebook, setNotebook] = useState<Notebook>({ poems: [] });
    const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [showEncryptionDialog, setShowEncryptionDialog] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    useEffect(() => {
        const loadNotebook = async () => {
            try {
                const headers: HeadersInit = {};
                if (encryptionKey) {
                    headers['x-encryption-key'] = encryptionKey;
                }

                const res = await fetch('/api/notebook', { headers });
                const data = await res.json();

                if (data.error) {
                    alert('Invalid encryption key');
                    setEncryptionKey(null);
                    setIsEncrypted(true); // DB content is encrypted
                    setShowEncryptionDialog(true); // re‑prompt
                    return;
                }

                if (data.encrypted) {
                    // Notebook is encrypted in DB but we don't have key yet
                    setIsEncrypted(true);
                    setShowEncryptionDialog(true);
                    setNotebook({ poems: [] }); // clear stale content
                    return;
                }

                // Successfully loaded (either unencrypted, or decrypted with key)
                setNotebook(data);
                setShowEncryptionDialog(false);
                // Reflect DB state if provided; fallback to false
                setIsEncrypted(Boolean((data as any)?.encrypted));
            } catch (error) {
                console.error('Failed to load notebook:', error);
            }
        };

        loadNotebook();
    }, [encryptionKey]);

    const saveNotebook = useCallback(async () => {
        try {
            const res = await fetch('/api/notebook', {
                body: JSON.stringify({ data: notebook, encryptionKey }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });
            const result = await res.json();
            if (result.success) {
                setLastSaved(result.timestamp);
                // After saving, prefer server truth; fallback to local key usage
                setIsEncrypted(result.encrypted ?? !!encryptionKey);

                toast.success('Saved!');
            }
        } catch (error) {
            console.error('Failed to save:', error);
        }
    }, [notebook, encryptionKey]);

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
        setShowEncryptionDialog(false);
    }, []);

    const toggleEncryption = useCallback(async () => {
        if (encryptionKey) {
            // Remove encryption: save as unencrypted immediately
            try {
                const res = await fetch('/api/notebook', {
                    body: JSON.stringify({ data: notebook, encryptionKey: null }),
                    headers: { 'Content-Type': 'application/json' },
                    method: 'POST',
                });
                const result = await res.json();
                if (result.success) {
                    setEncryptionKey(null);
                    setIsEncrypted(false);
                    setLastSaved(result.timestamp);
                }
            } catch (error) {
                console.error('Failed to remove encryption:', error);
            }
        } else {
            // Add encryption: prompt for key
            setShowEncryptionDialog(true);
        }
    }, [encryptionKey, notebook]);

    return {
        deletePoems,
        encryptionKey,
        handleEncryptionKeySet,
        handleSavePoem,
        isEncrypted,
        lastSaved,
        notebook,
        saveNotebook,
        setShowEncryptionDialog,
        showEncryptionDialog,
        toggleEncryption,
    };
}
