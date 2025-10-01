import { Edit2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import React from 'react';
import type { Thought } from '@/types/notebook';
import { Button } from './ui/button';

function MultipleThoughtsDisplay({
    thoughts,
    onEdit,
    onDelete,
    onAddAnother,
}: {
    thoughts: Thought[];
    onEdit: (thought: Thought) => void;
    onDelete: (thoughtId: string) => void;
    onAddAnother: () => void;
}) {
    return (
        <div className="space-y-4">
            <div className="max-h-96 space-y-3 overflow-y-auto">
                {thoughts.map((thought) => (
                    <div key={thought.id} className="rounded-lg border bg-muted/50 p-4">
                        <div className="mb-2 text-muted-foreground text-xs">
                            {new Date(thought.createdAt).toLocaleString()}
                        </div>
                        <p className="mb-3 whitespace-pre-wrap">{thought.text}</p>
                        <div className="flex gap-2">
                            <Button onClick={() => onEdit(thought)} variant="outline" size="sm">
                                <Edit2Icon className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button onClick={() => onDelete(thought.id)} variant="destructive" size="sm">
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <Button onClick={onAddAnother} variant="outline" size="sm" className="w-full">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Another Thought
            </Button>
        </div>
    );
}

export default React.memo(MultipleThoughtsDisplay);
