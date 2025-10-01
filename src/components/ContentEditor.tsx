import React, { useCallback, useEffect, useState } from 'react';
import type { Thought } from '@/types/notebook';
import { Label } from './ui/label';

function ContentEditor({
    content,
    thoughts,
    fontSize,
    contentEditableRef,
    onContentChange,
    onThoughtClick,
}: {
    content: string;
    thoughts: Thought[];
    fontSize: number;
    contentEditableRef: React.RefObject<HTMLDivElement | null>;
    onContentChange: () => void;
    onThoughtClick: (thoughtId: string) => void;
}) {
    const [isComposing, setIsComposing] = useState(false);

    const findThoughtInContent = useCallback(
        (thought: Thought, currentContent: string): { start: number; end: number } | null => {
            if (
                thought.startIndex < currentContent.length &&
                thought.endIndex <= currentContent.length &&
                currentContent.substring(thought.startIndex, thought.endIndex) === thought.selectedText
            ) {
                return { start: thought.startIndex, end: thought.endIndex };
            }

            const index = currentContent.indexOf(thought.selectedText);
            if (index !== -1) {
                return { start: index, end: index + thought.selectedText.length };
            }

            return null;
        },
        [],
    );

    const renderContentWithThoughts = useCallback(() => {
        if (!content || thoughts.length === 0) {
            return content;
        }

        const parts: Array<{ text: string; thoughtIds?: string[] }> = [];
        const thoughtsWithPositions = thoughts
            .map((thought) => {
                const position = findThoughtInContent(thought, content);
                return position ? { ...thought, ...position } : null;
            })
            .filter((t): t is Thought & { start: number; end: number } => t !== null)
            .sort((a, b) => a.start - b.start);

        let lastIndex = 0;
        const overlappingGroups: Map<string, string[]> = new Map();

        // Group overlapping thoughts
        thoughtsWithPositions.forEach((thought) => {
            const key = `${thought.start}-${thought.end}`;
            if (!overlappingGroups.has(key)) {
                overlappingGroups.set(key, []);
            }
            overlappingGroups.get(key)!.push(thought.id);
        });

        // Create unique ranges
        const uniqueRanges = Array.from(overlappingGroups.entries())
            .map(([key, ids]) => {
                const [start, end] = key.split('-').map(Number);
                return { start, end, ids };
            })
            .sort((a, b) => a.start - b.start);

        uniqueRanges.forEach(({ start, end, ids }) => {
            if (start >= lastIndex) {
                if (start > lastIndex) {
                    parts.push({ text: content.substring(lastIndex, start) });
                }
                parts.push({ text: content.substring(start, end), thoughtIds: ids });
                lastIndex = end;
            }
        });

        if (lastIndex < content.length) {
            parts.push({ text: content.substring(lastIndex) });
        }

        return parts;
    }, [content, thoughts, findThoughtInContent]);

    // Update the DOM only when content or thoughts change, not on every keystroke
    useEffect(() => {
        if (contentEditableRef.current && !isComposing && document.activeElement !== contentEditableRef.current) {
            const contentParts = renderContentWithThoughts();
            const newHTML = Array.isArray(contentParts)
                ? contentParts
                      .map((part) => {
                          if (part.thoughtIds) {
                              const thoughtCount = part.thoughtIds.length;
                              const countBadge =
                                  thoughtCount > 1 ? `<sup class="ml-0.5 font-bold">${thoughtCount}</sup>` : '';
                              return `<span class="cursor-pointer rounded bg-blue-100 px-1 text-blue-700 underline decoration-2 hover:bg-blue-200" data-thought-id="${part.thoughtIds[0]}" data-thought-count="${thoughtCount}">${part.text}${countBadge}</span>`;
                          }
                          return part.text;
                      })
                      .join('')
                : contentParts;

            if (contentEditableRef.current.innerHTML !== newHTML) {
                contentEditableRef.current.innerHTML = newHTML;
            }
        }
    }, [contentEditableRef, isComposing, renderContentWithThoughts]);

    // Handle clicks on thought spans using event delegation
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const thoughtSpan = target.closest('[data-thought-id]') as HTMLElement;
            if (thoughtSpan) {
                e.preventDefault();
                const thoughtId = thoughtSpan.getAttribute('data-thought-id');
                if (thoughtId) {
                    onThoughtClick(thoughtId);
                }
            }
        };

        const el = contentEditableRef.current;
        if (el) {
            el.addEventListener('click', handleClick);
            return () => el.removeEventListener('click', handleClick);
        }
    }, [onThoughtClick, contentEditableRef]);

    return (
        <div>
            <Label htmlFor="content">Content</Label>
            <div
                ref={contentEditableRef}
                contentEditable
                onInput={onContentChange}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                tabIndex={0}
                className="mt-1.5 min-h-[400px] rounded-md border border-input bg-background px-3 py-2 font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{ fontSize: `${fontSize}px`, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                role="textbox"
                aria-label="Poem content"
                aria-multiline="true"
            />
            <p className="mt-2 text-muted-foreground text-sm">
                Select text and click "Add Thought" to annotate. Click highlighted text to view thoughts.
            </p>
        </div>
    );
}

export default React.memo(ContentEditor);
