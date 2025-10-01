import React from 'react';
import { Combobox } from './ComboBox';
import TagInput from './TagInput';
import { Input } from './ui/input';
import { Label } from './ui/label';

function MetadataForm({
    category,
    chapter,
    allCategories,
    allChapters,
    poemTags,
    allTags,
    urls,
    createdOn,
    lastUpdatedOn,
    onCategoryChange,
    onChapterChange,
    onTagsChange,
    onUrlsChange,
    onCreatedOnChange,
    onLastUpdatedOnChange,
}: {
    category: string;
    chapter: string;
    allCategories: string[];
    allChapters: string[];
    poemTags: string[];
    allTags: string[];
    urls: string[];
    createdOn: string;
    lastUpdatedOn: string;
    onCategoryChange: (value: string) => void;
    onChapterChange: (value: string) => void;
    onTagsChange: (tags: string[]) => void;
    onUrlsChange: (urls: string[]) => void;
    onCreatedOnChange: (date: string) => void;
    onLastUpdatedOnChange: (date: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="category">Category</Label>
                    <Combobox
                        options={allCategories}
                        value={category}
                        onChange={onCategoryChange}
                        placeholder="Select or create category"
                    />
                </div>

                <div>
                    <Label htmlFor="chapter">Chapter</Label>
                    <Combobox
                        options={allChapters}
                        value={chapter}
                        onChange={onChapterChange}
                        placeholder="Select or create chapter"
                    />
                </div>
            </div>

            <TagInput tags={poemTags} allTags={allTags} onTagsChange={onTagsChange} />

            <div>
                <TagInput label="URLs" tags={urls} allTags={[]} onTagsChange={onUrlsChange} placeholder="Add URL..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="createdOn">Created On</Label>
                    <Input
                        id="createdOn"
                        type="date"
                        className="mt-1.5"
                        value={createdOn}
                        onChange={(e) => onCreatedOnChange(e.target.value)}
                    />
                </div>

                <div>
                    <Label htmlFor="lastUpdatedOn">Last Updated On</Label>
                    <Input
                        id="lastUpdatedOn"
                        type="date"
                        className="mt-1.5"
                        value={lastUpdatedOn}
                        onChange={(e) => onLastUpdatedOnChange(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

export default React.memo(MetadataForm);
