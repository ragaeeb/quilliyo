import { useCallback, useEffect, useState } from 'react';
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
                    return;
                }

                if (data.encrypted) {
                    setIsEncrypted(true);
                    setShowEncryptionDialog(true);
                    return;
                }

                setNotebook(data);
                setIsEncrypted(false);
            } catch (error) {
                console.error('Failed to load notebook:', error);
            }
        };

        loadNotebook();
    }, [encryptionKey]);

    const saveNotebook = useCallback(async () => {
        try {
            const res = await fetch('/api/notebook', {
                method: 'POST',
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
        setIsEncrypted(!!key);
    }, []);

    const toggleEncryption = useCallback(() => {
        if (encryptionKey) {
            // Decrypt: remove the encryption key
            // Important: we need to save immediately to persist the decrypted state
            setEncryptionKey(null);
            setIsEncrypted(false);
            // The next save will store the notebook unencrypted
        } else {
            // Encrypt: prompt for key
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
        saveNotebook,
        handleSavePoem,
        deletePoems,
        handleEncryptionKeySet,
        toggleEncryption,
    };
}
