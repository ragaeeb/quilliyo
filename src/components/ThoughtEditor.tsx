import React from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

function ThoughtEditor({
    value,
    onChange,
    onSave,
    onCancel,
}: {
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="space-y-4">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Write your thought here..."
                rows={6}
                className="resize-none"
            />
            <div className="flex gap-2">
                <Button onClick={onSave} className="flex-1">
                    Save Thought
                </Button>
                <Button onClick={onCancel} variant="outline" className="flex-1">
                    Cancel
                </Button>
            </div>
        </div>
    );
}

export default React.memo(ThoughtEditor);
