import { MessageSquare } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Poem, Thought } from '@/types/notebook';
import ContentEditor from './ContentEditor';
import FontSizeControl from './FontSizeControl';
import MetadataForm from './MetadataForm';
import MultipleThoughtsDisplay from './MultipleThoughtsDisplay';
import ThoughtEditor from './ThoughtEditor';

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
    const [poemTags, setPoemTags] = useState<string[]>(poem?.tags || []);
    const [category, setCategory] = useState(poem?.category || '');
    const [chapter, setChapter] = useState(poem?.chapter || '');
    const [urls, setUrls] = useState<string[]>(
        poem?.metadata?.urls ? poem.metadata.urls.split('\n').filter(Boolean) : [],
    );
    const [fontSize, setFontSize] = useState(14);
    const [thoughts, setThoughts] = useState<Thought[]>(
        poem?.metadata?.thoughts ? JSON.parse(poem.metadata.thoughts) : [],
    );
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [currentThought, setCurrentThought] = useState('');
    const [selectedRange, setSelectedRange] = useState<{ start: number; end: number; text: string } | null>(null);
    const [editingThought, setEditingThought] = useState<Thought | null>(null);
    const [viewingThoughtIds, setViewingThoughtIds] = useState<string[]>([]);
    const [content, setContent] = useState(poem?.content || '');
    const [title, setTitle] = useState(poem?.title || '');
    const [createdOn, setCreatedOn] = useState(
        poem?.createdOn ? new Date(poem.createdOn).toISOString().split('T')[0] : '',
    );
    const [lastUpdatedOn, setLastUpdatedOn] = useState(
        poem?.lastUpdatedOn ? new Date(poem.lastUpdatedOn).toISOString().split('T')[0] : '',
    );
    const contentEditableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setContent(poem?.content || '');
        setTitle(poem?.title || '');
        setPoemTags(poem?.tags || []);
        setCategory(poem?.category || '');
        setChapter(poem?.chapter || '');
        setUrls(poem?.metadata?.urls ? poem.metadata.urls.split('\n').filter(Boolean) : []);
        setThoughts(poem?.metadata?.thoughts ? JSON.parse(poem.metadata.thoughts) : []);
        setCreatedOn(poem?.createdOn ? new Date(poem.createdOn).toISOString().split('T')[0] : '');
        setLastUpdatedOn(poem?.lastUpdatedOn ? new Date(poem.lastUpdatedOn).toISOString().split('T')[0] : '');
    }, [poem]);

    const handleAddThought = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            alert('Please select some text first');
            return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();

        if (!selectedText || selectedText.trim() === '') {
            alert('Please select some text first');
            return;
        }

        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(contentEditableRef.current!);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;
        const end = start + selectedText.length;

        setSelectedRange({ start, end, text: selectedText });
        setCurrentThought('');
        setEditingThought(null);
        setViewingThoughtIds([]);
        setIsDrawerOpen(true);
    }, []);

    const handleSaveThought = useCallback(() => {
        if (!currentThought.trim()) {
            alert('Please write a thought');
            return;
        }

        if (editingThought) {
            setThoughts((prev) => prev.map((t) => (t.id === editingThought.id ? { ...t, text: currentThought } : t)));
        } else if (selectedRange) {
            const newThought: Thought = {
                id: Date.now().toString(),
                text: currentThought,
                selectedText: selectedRange.text,
                startIndex: selectedRange.start,
                endIndex: selectedRange.end,
                createdAt: new Date().toISOString(),
            };
            setThoughts((prev) => [...prev, newThought]);
        }

        setIsDrawerOpen(false);
        setCurrentThought('');
        setSelectedRange(null);
        setEditingThought(null);
        setViewingThoughtIds([]);
    }, [currentThought, editingThought, selectedRange]);

    const handleDeleteThought = useCallback((thoughtId: string) => {
        setThoughts((prev) => prev.filter((t) => t.id !== thoughtId));
        setIsDrawerOpen(false);
        setViewingThoughtIds([]);
    }, []);

    const handleEditThought = useCallback((thought: Thought) => {
        setEditingThought(thought);
        setCurrentThought(thought.text);
        setViewingThoughtIds([]);
    }, []);

    const handleThoughtClick = useCallback(
        (thoughtId: string) => {
            // Find all thoughts that share the same selection
            const clickedThought = thoughts.find((t) => t.id === thoughtId);
            if (clickedThought) {
                const relatedThoughts = thoughts.filter(
                    (t) =>
                        t.selectedText === clickedThought.selectedText &&
                        t.startIndex === clickedThought.startIndex &&
                        t.endIndex === clickedThought.endIndex,
                );
                setViewingThoughtIds(relatedThoughts.map((t) => t.id));
                setEditingThought(null);
                setCurrentThought('');
                setSelectedRange({
                    start: clickedThought.startIndex,
                    end: clickedThought.endIndex,
                    text: clickedThought.selectedText,
                });
                setIsDrawerOpen(true);
            }
        },
        [thoughts],
    );

    const handleAddAnotherThought = useCallback(() => {
        if (selectedRange) {
            setCurrentThought('');
            setEditingThought(null);
            setViewingThoughtIds([]);
        }
    }, [selectedRange]);

    const handleContentChange = useCallback(() => {
        if (contentEditableRef.current) {
            const newContent = contentEditableRef.current.innerText;
            setContent(newContent);
        }
    }, []);

    const handleSave = useCallback(() => {
        const cleanPoem: Poem = {
            id: poem?.id || Date.now().toString(),
            title: title || 'Untitled',
            content: content || '',
        };

        if (poemTags.length > 0) cleanPoem.tags = poemTags;
        if (category) cleanPoem.category = category;
        if (chapter) cleanPoem.chapter = chapter;
        if (createdOn) cleanPoem.createdOn = new Date(createdOn).toISOString();
        if (lastUpdatedOn) {
            cleanPoem.lastUpdatedOn = new Date(lastUpdatedOn).toISOString();
        } else {
            cleanPoem.lastUpdatedOn = new Date().toISOString();
        }

        const metadata: any = { ...(poem?.metadata || {}) };

        if (urls.length > 0) {
            metadata.urls = urls.join('\n');
        }

        if (thoughts.length > 0) {
            metadata.thoughts = JSON.stringify(thoughts);
        }

        if (Object.keys(metadata).length > 0) {
            cleanPoem.metadata = metadata;
        }

        onSave(cleanPoem);
        onClose();
    }, [poem, title, content, poemTags, category, chapter, createdOn, lastUpdatedOn, urls, thoughts, onSave, onClose]);

    if (!poem) return null;

    const viewingThoughts = thoughts.filter((t) => viewingThoughtIds.includes(t.id));
    const isViewing = viewingThoughts.length > 0 && !editingThought;
    const isEditing = !!editingThought;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] gap-0 p-0">
                    <DialogHeader className="border-b px-6 pt-6 pb-4">
                        <div className="flex items-center justify-between">
                            <DialogTitle>Edit Poem</DialogTitle>
                            <div className="flex items-center gap-3">
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

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>
                            {isEditing
                                ? 'Edit Thought'
                                : isViewing
                                  ? `Viewing ${viewingThoughts.length} Thought${viewingThoughts.length > 1 ? 's' : ''}`
                                  : 'Add Thought'}
                        </DrawerTitle>
                        <DrawerDescription>
                            {selectedRange && <span className="font-mono text-sm">"{selectedRange.text}"</span>}
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                        {isViewing ? (
                            <MultipleThoughtsDisplay
                                thoughts={viewingThoughts}
                                onEdit={handleEditThought}
                                onDelete={handleDeleteThought}
                                onAddAnother={handleAddAnotherThought}
                            />
                        ) : (
                            <ThoughtEditor
                                value={currentThought}
                                onChange={setCurrentThought}
                                onSave={handleSaveThought}
                                onCancel={() => setIsDrawerOpen(false)}
                            />
                        )}
                    </div>
                    {isViewing && (
                        <DrawerFooter>
                            <DrawerClose asChild>
                                <Button variant="outline">Close</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
});
