import { TypeIcon } from 'lucide-react';
import React from 'react';

function FontSizeControl({
    fontSize,
    onFontSizeChange,
}: {
    fontSize: number;
    onFontSizeChange: (size: number) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <input
                type="range"
                min="12"
                max="24"
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-24 cursor-pointer"
                aria-label="Font size"
            />
            <span className="w-8 text-muted-foreground text-sm">{fontSize}px</span>
        </div>
    );
}

export default React.memo(FontSizeControl);
