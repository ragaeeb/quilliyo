'use client';

import { format } from 'date-fns';
import Fuse from 'fuse.js';
import { Lock, Plus, Save, Search, Trash2, Unlock } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EncryptionDialog } from '@/components/EncryptionDialog';
import { PoemCard } from '@/components/PoemCard';
import { PoemEditModal } from '@/components/PoemEditModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Notebook, Poem } from '@/types/notebook';

export default function Home() {
    const [notebook, setNotebook] = useState<Notebook>({ poems: [] });
    const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [showEncryptionDialog, setShowEncryptionDialog] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Memoized values for optimization
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        notebook.poems.forEach((p) => {
            p.tags?.forEach((t) => tags.add(t.toLowerCase()));
        });
        return Array.from(tags).sort();
    }, [notebook.poems]);

    const allCategories = useMemo(() => {
        const cats = new Set<string>();
        notebook.poems.forEach((p) => p.category && cats.add(p.category));
        return Array.from(cats).sort();
    }, [notebook.poems]);

    const allChapters = useMemo(() => {
        const chaps = new Set<string>();
        notebook.poems.forEach((p) => p.chapter && chaps.add(p.chapter));
        return Array.from(chaps).sort();
    }, [notebook.poems]);

    // Load notebook
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

    // Search with debouncing
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Fuzzy search
    const filteredPoems = useMemo(() => {
        if (!debouncedSearch) return notebook.poems;

        const fuse = new Fuse(notebook.poems, {
            keys: ['title', 'content', 'tags', 'category', 'chapter'],
            threshold: 0.3,
            includeScore: true,
        });

        return fuse.search(debouncedSearch).map((result) => result.item);
    }, [notebook.poems, debouncedSearch]);

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

    const createNewPoem = useCallback(() => {
        const newPoem: Poem = {
            id: Date.now().toString(),
            title: 'Untitled',
            content: '',
            lastUpdatedOn: new Date().toISOString(),
        };
        setSelectedPoem(newPoem);
        setIsModalOpen(true);
    }, []);

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

    const deleteSelected = useCallback(() => {
        setNotebook((prev) => ({ ...prev, poems: prev.poems.filter((p) => !selectedIds.has(p.id)) }));
        setSelectedIds(new Set());
    }, [selectedIds]);

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleEditPoem = useCallback((poem: Poem) => {
        setSelectedPoem(poem);
        setIsModalOpen(true);
    }, []);

    const handleEncryptionKeySet = useCallback((key: string) => {
        setEncryptionKey(key);
        setIsEncrypted(!!key);
    }, []);

    const toggleEncryption = useCallback(() => {
        if (encryptionKey) {
            // Remove encryption
            setEncryptionKey(null);
            setIsEncrypted(false);
        } else {
            // Add encryption
            setShowEncryptionDialog(true);
        }
    }, [encryptionKey]);

    return (
        <div className="container mx-auto p-8">
            <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="font-bold text-3xl">Notebook</h1>
                    <div className="flex items-center gap-2">
                        {lastSaved && (
                            <span className="text-gray-500 text-sm">
                                Last saved: {format(new Date(lastSaved), 'HH:mm:ss')}
                            </span>
                        )}
                        <Button onClick={toggleEncryption} variant="outline" size="sm">
                            {isEncrypted || encryptionKey ? (
                                <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Encrypted
                                </>
                            ) : (
                                <>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Unencrypted
                                </>
                            )}
                        </Button>
                        <Button onClick={saveNotebook} size="sm">
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                        <Input
                            placeholder="Search poems..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={createNewPoem}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Poem
                    </Button>
                    {selectedIds.size > 0 && (
                        <Button onClick={deleteSelected} variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPoems.map((poem) => (
                    <PoemCard
                        key={poem.id}
                        poem={poem}
                        isSelected={selectedIds.has(poem.id)}
                        onToggleSelect={toggleSelect}
                        onEdit={handleEditPoem}
                    />
                ))}
            </div>

            <PoemEditModal
                poem={selectedPoem}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedPoem(null);
                }}
                onSave={handleSavePoem}
                allTags={allTags}
                allCategories={allCategories}
                allChapters={allChapters}
            />

            <EncryptionDialog
                isOpen={showEncryptionDialog}
                onClose={() => setShowEncryptionDialog(false)}
                onSetKey={handleEncryptionKeySet}
                isEncrypted={isEncrypted && !encryptionKey}
            />
        </div>
    );
}
