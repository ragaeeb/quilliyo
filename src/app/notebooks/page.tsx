'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotebooks } from '@/hooks/useNotebooks';

export default function NotebooksPage() {
    const { notebooks, isLoading, createNotebook } = useNotebooks();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newNotebookId, setNewNotebookId] = useState('');
    const [newNotebookName, setNewNotebookName] = useState('');

    const handleCreate = async () => {
        if (!newNotebookId || !newNotebookName) return;

        const result = await createNotebook(newNotebookId.toLowerCase().replace(/\s+/g, '-'), newNotebookName);

        if (result.success) {
            setShowCreateForm(false);
            setNewNotebookId('');
            setNewNotebookName('');
        } else {
            alert(result.error);
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-bold text-3xl">My Notebooks</h1>
                <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Notebook
                </Button>
            </div>

            {showCreateForm && (
                <div className="mb-6 rounded-lg border p-4">
                    <h2 className="mb-4 font-semibold text-lg">Create New Notebook</h2>
                    <div className="space-y-4">
                        <Input
                            placeholder="Notebook Name"
                            value={newNotebookName}
                            onChange={(e) => setNewNotebookName(e.target.value)}
                        />
                        <Input
                            placeholder="Notebook ID (e.g., my-poetry)"
                            value={newNotebookId}
                            onChange={(e) => setNewNotebookId(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleCreate}>Create</Button>
                            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notebooks.map((notebook) => (
                    <Link
                        key={notebook.notebookId}
                        href={`/notebooks/${notebook.notebookId}`}
                        className="block rounded-lg border p-4 transition-colors hover:bg-accent"
                    >
                        <h3 className="font-semibold">{notebook.name}</h3>
                        {notebook.description && (
                            <p className="text-muted-foreground text-sm">{notebook.description}</p>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}
