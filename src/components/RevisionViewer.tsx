import { format } from 'date-fns';
import { ArrowLeft, Clock, History, RotateCcw } from 'lucide-react';
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
            <DialogContent className="max-h-[85vh] max-w-5xl gap-0 p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <History className="h-5 w-5 text-primary" />
                        <span>Revision History</span>
                        {poem && <span className="text-muted-foreground">• {poem.title}</span>}
                    </DialogTitle>
                </DialogHeader>

                {isLoading && (
                    <div className="flex h-[60vh] items-center justify-center">
                        <div className="text-center">
                            <Clock className="mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-muted-foreground text-sm">Loading revisions...</p>
                        </div>
                    </div>
                )}

                {!isLoading && !selectedRevision && (
                    <ScrollArea className="h-[65vh]">
                        {revisions.length === 0 ? (
                            <div className="flex h-full items-center justify-center p-8">
                                <div className="text-center">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                                        <History className="h-10 w-10 text-primary/60" />
                                    </div>
                                    <p className="font-semibold text-foreground text-lg">No revision history yet</p>
                                    <p className="mx-auto mt-2 max-w-sm text-muted-foreground text-sm">
                                        Your edit history will appear here after you save changes to this poem
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 p-6">
                                {revisions.map((revision, index) => (
                                    <Button
                                        key={revision.revision_number}
                                        onClick={() => handleRevisionClick(revision.revision_number)}
                                        variant="ghost"
                                        className="group h-auto w-full justify-start rounded-xl border border-border/50 bg-card/50 p-6 text-left backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 font-bold text-primary text-xs transition-all group-hover:from-primary/30 group-hover:to-primary/10">
                                                    #{revision.revision_number}
                                                </div>
                                                <span className="font-semibold text-base text-foreground transition-colors group-hover:text-primary">
                                                    {revision.title}
                                                </span>
                                                {index === 0 && (
                                                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-semibold text-primary text-xs ring-1 ring-primary/20">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>
                                                    {format(new Date(revision.created_at), 'MMM d, yyyy • h:mm a')}
                                                </span>
                                            </div>
                                            <div className="line-clamp-2 text-muted-foreground/90 text-sm leading-relaxed">
                                                {revision.preview}...
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                )}

                {!isLoading && selectedRevision && (
                    <div className="flex h-[65vh] flex-col">
                        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-4">
                            <Button onClick={handleBack} variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to List
                            </Button>
                            <Button onClick={handleRestore} size="sm" className="gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Restore This Version
                            </Button>
                        </div>

                        <div className="border-b bg-muted/20 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                                    #{selectedRevision.revision_number}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground text-lg">{selectedRevision.title}</h3>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-sm">
                                        <Clock className="h-3.5 w-3.5" />
                                        {format(new Date(selectedRevision.created_at), 'MMMM d, yyyy • h:mm a')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 bg-muted/10 p-6">
                            <div className="mx-auto max-w-3xl rounded-lg border bg-background p-6 shadow-sm">
                                <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed">
                                    {selectedRevision.content}
                                </pre>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
