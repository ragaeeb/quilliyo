// src/components/RevisionViewer.tsx

import { format } from 'date-fns';
import { History, RotateCcw, X } from 'lucide-react';
import { useRevisions } from '@/hooks/useRevisions';
import type { Poem } from '@/types/notebook';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface RevisionViewerProps {
    poem: Poem | null;
    isOpen: boolean;
    onClose: () => void;
    onRestore: (content: string) => void;
    notebookId?: string;
}

export function RevisionViewer({ poem, isOpen, onClose, onRestore, notebookId = 'default' }: RevisionViewerProps) {
    const { revisions, selectedRevision, isLoading, loadRevision, clearSelectedRevision } = useRevisions(
        poem?.id || null,
        notebookId,
    );

    const handleRevisionClick = async (revisionNumber: number) => {
        await loadRevision(revisionNumber);
    };

    const handleRestore = () => {
        if (selectedRevision) {
            onRestore(selectedRevision.content);
            clearSelectedRevision();
            onClose();
        }
    };

    const handleBack = () => {
        clearSelectedRevision();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[80vh] max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Revision History
                        {poem && ` - ${poem.title}`}
                    </DialogTitle>
                </DialogHeader>

                {isLoading && <div className="p-4 text-center text-muted-foreground">Loading...</div>}

                {!isLoading && !selectedRevision && (
                    <ScrollArea className="h-[60vh]">
                        {revisions.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">No revision history available</div>
                        ) : (
                            <div className="space-y-2 p-4">
                                {revisions.map((revision) => (
                                    <button
                                        key={revision.revision_number}
                                        onClick={() => handleRevisionClick(revision.revision_number)}
                                        className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-medium">Revision #{revision.revision_number}</div>
                                                <div className="text-muted-foreground text-sm">
                                                    {format(new Date(revision.created_at), 'PPpp')}
                                                </div>
                                                <div className="mt-2 line-clamp-2 text-muted-foreground text-sm">
                                                    {revision.preview}...
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                )}

                {!isLoading && selectedRevision && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Button onClick={handleBack} variant="ghost" size="sm">
                                <X className="mr-2 h-4 w-4" />
                                Back to List
                            </Button>
                            <Button onClick={handleRestore} size="sm">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore This Version
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className="text-muted-foreground text-sm">
                                Revision #{selectedRevision.revision_number} •{' '}
                                {format(new Date(selectedRevision.created_at), 'PPpp')}
                            </div>
                            <div className="font-medium">{selectedRevision.title}</div>
                        </div>

                        <ScrollArea className="h-[50vh] rounded-lg border bg-muted/30 p-4">
                            <pre className="whitespace-pre-wrap font-mono text-sm">{selectedRevision.content}</pre>
                        </ScrollArea>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
