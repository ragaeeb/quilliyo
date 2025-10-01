'use client';

import { format } from 'date-fns';
import { Lock, Plus, Save, Search, Trash2, Unlock } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { EncryptionDialog } from '@/components/EncryptionDialog';
import { PoemCard } from '@/components/PoemCard';
import { PoemEditModal } from '@/components/PoemEditModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMetadata } from '@/hooks/useMetadata';
import { useNotebook } from '@/hooks/useNotebook';
import { useSearch } from '@/hooks/useSearch';
import type { Poem } from '@/types/notebook';

export default function NotebookPage() {
    const params = useParams();
    const notebookId = params.notebookId as string;

    const {
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
    } = useNotebook(notebookId);

    const { searchQuery, setSearchQuery, filteredPoems } = useSearch(notebook.poems);
    const { allTags, allCategories, allChapters } = useMetadata(notebook.poems);

    const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

    const deleteSelected = useCallback(() => {
        deletePoems(selectedIds);
        setSelectedIds(new Set());
    }, [selectedIds, deletePoems]);

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

    if (isLoading) {
        return <div className="container mx-auto p-8">Loading notebook...</div>;
    }

    if (error) {
        return (
            <div className="container mx-auto p-8">
                <div className="rounded-lg border border-destructive p-4 text-destructive">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-3xl">{notebook.name || 'Notebook'}</h1>
                        {notebook.description && <p className="text-muted-foreground">{notebook.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {lastSaved && (
                            <span className="text-muted-foreground text-sm">
                                Last saved: {format(new Date(lastSaved), 'HH:mm:ss')}
                            </span>
                        )}
                        <ThemeToggle />
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
                        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
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
