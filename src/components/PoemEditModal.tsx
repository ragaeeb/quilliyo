import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Poem } from '@/types/notebook';
import { Combobox } from './ComboBox';
import { TagInput } from './TagInput';

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

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const createdOn = formData.get('createdOn') as string;
        const lastUpdatedOn = formData.get('lastUpdatedOn') as string;

        const cleanPoem: Poem = {
            id: poem?.id || Date.now().toString(),
            title: title || 'Untitled',
            content: content || '',
        };

        // Only add optional fields if they have values
        if (poemTags.length > 0) cleanPoem.tags = poemTags;
        if (category) cleanPoem.category = category;
        if (chapter) cleanPoem.chapter = chapter;
        if (createdOn) cleanPoem.createdOn = new Date(createdOn).toISOString();
        if (lastUpdatedOn) {
            cleanPoem.lastUpdatedOn = new Date(lastUpdatedOn).toISOString();
        } else {
            cleanPoem.lastUpdatedOn = new Date().toISOString();
        }

        // Add metadata with urls if any urls exist
        if (urls.length > 0) {
            cleanPoem.metadata = { ...(poem?.metadata || {}), urls: urls.join('\n') };
        } else if (poem?.metadata) {
            // Preserve existing metadata but remove urls
            const { urls: _, ...restMetadata } = poem.metadata;
            if (Object.keys(restMetadata).length > 0) {
                cleanPoem.metadata = restMetadata;
            }
        }

        onSave(cleanPoem);
        onClose();
    };

    if (!poem) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] gap-0 p-0">
                <DialogHeader className="border-b px-6 pt-6 pb-4">
                    <DialogTitle>Edit Poem</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex h-[calc(95vh-80px)] flex-col">
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" defaultValue={poem.title} className="mt-1.5" />
                        </div>

                        <div>
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                name="content"
                                defaultValue={poem.content}
                                rows={15}
                                className="mt-1.5 min-h-[400px] font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Combobox
                                    options={allCategories}
                                    value={category}
                                    onChange={setCategory}
                                    placeholder="Select or create category"
                                />
                            </div>

                            <div>
                                <Label htmlFor="chapter">Chapter</Label>
                                <Combobox
                                    options={allChapters}
                                    value={chapter}
                                    onChange={setChapter}
                                    placeholder="Select or create chapter"
                                />
                            </div>
                        </div>

                        <TagInput tags={poemTags} allTags={allTags} onTagsChange={setPoemTags} />

                        <div>
                            <Label>URLs</Label>
                            <TagInput tags={urls} allTags={[]} onTagsChange={setUrls} placeholder="Add URL..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="createdOn">Created On</Label>
                                <Input
                                    id="createdOn"
                                    name="createdOn"
                                    type="date"
                                    className="mt-1.5"
                                    defaultValue={
                                        poem.createdOn ? new Date(poem.createdOn).toISOString().split('T')[0] : ''
                                    }
                                />
                            </div>

                            <div>
                                <Label htmlFor="lastUpdatedOn">Last Updated On</Label>
                                <Input
                                    id="lastUpdatedOn"
                                    name="lastUpdatedOn"
                                    type="date"
                                    className="mt-1.5"
                                    defaultValue={
                                        poem.lastUpdatedOn
                                            ? new Date(poem.lastUpdatedOn).toISOString().split('T')[0]
                                            : ''
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
});
