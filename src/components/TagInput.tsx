import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TagInputProps {
    tags: string[];
    allTags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
    label?: string;
}

function TagInput({ tags, allTags, onTagsChange, placeholder, label }: TagInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = e.currentTarget.value.trim().toLowerCase();
            if (value && !tags.includes(value)) {
                onTagsChange([...tags, value]);
                e.currentTarget.value = '';
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter((t) => t !== tagToRemove));
    };

    return (
        <div>
            <Label>{label || 'Tags'}</Label>
            <div className="mt-1.5 mb-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                    <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeTag(tag)}
                    >
                        {tag} ×
                    </Badge>
                ))}
            </div>
            <Input
                id="tagInput"
                list="tags"
                placeholder={placeholder || 'Add tag (press Enter)'}
                onKeyDown={handleKeyDown}
            />
            <datalist id="tags">
                {allTags.map((tag) => (
                    <option key={tag} value={tag} />
                ))}
            </datalist>
        </div>
    );
}

export default React.memo(TagInput);
