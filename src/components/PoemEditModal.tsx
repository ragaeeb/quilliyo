import { HistoryIcon, MessageSquare } from 'lucide-react';
import { memo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePoemEditState } from '@/hooks/usePoemEditState';
import { useTextSelection } from '@/hooks/useTextSelection';
import { useThoughtActions } from '@/hooks/useThoughtActions';
import { useThoughtDrawer } from '@/hooks/useThoughtDrawer';
import { buildPoemForSave } from '@/lib/poemSaveUtils';
import type { Poem, Thought } from '@/types/notebook';
import ContentEditor from './ContentEditor';
import FontSizeControl from './FontSizeControl';
import MetadataForm from './MetadataForm';
import { RevisionViewer } from './RevisionViewer';
import ThoughtDrawer from './ThoughtDrawer';

interface PoemEditModalProps {
    poem: Poem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (poem: Poem) => void;
    allTags: string[];
    allCategories: string[];
    allChapters: string[];
}

export const PoemEditModal = memo(function PoemEditModal({
    poem,
    isOpen,
    onClose,
    onSave,
    allTags,
    allCategories,
    allChapters,
}: PoemEditModalProps) {
    const contentEditableRef = useRef<HTMLDivElement>(null);

    const {
        content,
        setContent,
        title,
        setTitle,
        poemTags,
        setPoemTags,
        category,
        setCategory,
        chapter,
        setChapter,
        showRevisions,
        setShowRevisions,
        urls,
        setUrls,
        thoughts,
        setThoughts,
        createdOn,
        setCreatedOn,
        lastUpdatedOn,
        setLastUpdatedOn,
        fontSize,
        setFontSize,
    } = usePoemEditState(poem);

    const { getSelectedRange } = useTextSelection(contentEditableRef);

    const {
        isDrawerOpen,
        setIsDrawerOpen,
        currentThought,
        setCurrentThought,
        selectedRange,
        editingThought,
        viewingThoughtIds,
        openForNewThought,
        openForViewing,
        openForEditing,
        resetForNewThought,
        closeDrawer,
    } = useThoughtDrawer();

    const { saveThought, deleteThought, getRelatedThoughts } = useThoughtActions(thoughts, setThoughts);

    const handleRestoreRevision = (revisionContent: string) => {
        setContent(revisionContent);
        toast.success('Revision restored!');
    };

    const handleAddThought = useCallback(() => {
        const range = getSelectedRange();
        if (!range) {
            toast.error('Please select some text first');
            return;
        }
        openForNewThought(range);
    }, [getSelectedRange, openForNewThought]);

    const handleSaveThought = useCallback(() => {
        const success = saveThought(currentThought, editingThought, selectedRange);
        if (success) {
            closeDrawer();
        }
    }, [currentThought, editingThought, selectedRange, saveThought, closeDrawer]);

    const handleDeleteThought = useCallback(
        (thoughtId: string) => {
            deleteThought(thoughtId);
            closeDrawer();
        },
        [deleteThought, closeDrawer],
    );

    const handleEditThought = useCallback(
        (thought: Thought) => {
            openForEditing(thought);
        },
        [openForEditing],
    );

    const handleThoughtClick = useCallback(
        (thoughtId: string) => {
            const relatedThoughts = getRelatedThoughts(thoughtId);
            if (relatedThoughts.length > 0) {
                const firstThought = relatedThoughts[0];
                openForViewing(
                    relatedThoughts.map((t) => t.id),
                    { end: firstThought.endIndex, start: firstThought.startIndex, text: firstThought.selectedText },
                );
            }
        },
        [getRelatedThoughts, openForViewing],
    );

    const handleAddAnotherThought = useCallback(() => {
        resetForNewThought();
    }, [resetForNewThought]);

    const handleContentChange = useCallback(() => {
        if (contentEditableRef.current) {
            const newContent = contentEditableRef.current.innerText;
            setContent(newContent);
        }
    }, [setContent]);

    const handleSave = useCallback(() => {
        const savedPoem = buildPoemForSave(
            poem,
            title,
            content,
            poemTags,
            category,
            chapter,
            createdOn,
            lastUpdatedOn,
            urls,
            thoughts,
        );
        onSave(savedPoem);
        onClose();
    }, [poem, title, content, poemTags, category, chapter, createdOn, lastUpdatedOn, urls, thoughts, onSave, onClose]);

    if (!poem) {
        return null;
    }

    const viewingThoughts = thoughts.filter((t) => viewingThoughtIds.includes(t.id));

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] gap-0 p-0">
                    <DialogHeader className="border-b px-6 pt-6 pb-4">
                        <div className="flex items-center justify-between">
                            <DialogTitle>Edit Poem</DialogTitle>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowRevisions(true);
                                    }}
                                >
                                    <HistoryIcon />
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddThought}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Add Thought
                                </Button>
                                <FontSizeControl fontSize={fontSize} onFontSizeChange={setFontSize} />
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex h-[calc(95vh-80px)] flex-col">
                        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="mt-1.5"
                                />
                            </div>

                            <ContentEditor
                                content={content}
                                thoughts={thoughts}
                                fontSize={fontSize}
                                contentEditableRef={contentEditableRef}
                                onContentChange={handleContentChange}
                                onThoughtClick={handleThoughtClick}
                            />

                            <MetadataForm
                                category={category}
                                chapter={chapter}
                                allCategories={allCategories}
                                allChapters={allChapters}
                                poemTags={poemTags}
                                allTags={allTags}
                                urls={urls}
                                createdOn={createdOn}
                                lastUpdatedOn={lastUpdatedOn}
                                onCategoryChange={setCategory}
                                onChapterChange={setChapter}
                                onTagsChange={setPoemTags}
                                onUrlsChange={setUrls}
                                onCreatedOnChange={setCreatedOn}
                                onLastUpdatedOnChange={setLastUpdatedOn}
                            />
                        </div>

                        <div className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSave}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <RevisionViewer
                poem={poem}
                isOpen={showRevisions}
                onClose={() => setShowRevisions(false)}
                onRestore={handleRestoreRevision}
            />
            <ThoughtDrawer
                isOpen={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                currentThought={currentThought}
                onCurrentThoughtChange={setCurrentThought}
                selectedRange={selectedRange}
                editingThought={editingThought}
                viewingThoughts={viewingThoughts}
                onSave={handleSaveThought}
                onEdit={handleEditThought}
                onDelete={handleDeleteThought}
                onAddAnother={handleAddAnotherThought}
            />
        </>
    );
});
