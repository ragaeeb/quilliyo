import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import type { Thought } from '@/types/notebook';
import MultipleThoughtsDisplay from './MultipleThoughtsDisplay';
import ThoughtEditor from './ThoughtEditor';

interface ThoughtDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    currentThought: string;
    onCurrentThoughtChange: (text: string) => void;
    selectedRange: { start: number; end: number; text: string } | null;
    editingThought: Thought | null;
    viewingThoughts: Thought[];
    onSave: () => void;
    onEdit: (thought: Thought) => void;
    onDelete: (thoughtId: string) => void;
    onAddAnother: () => void;
}

export default function ThoughtDrawer({
    isOpen,
    onOpenChange,
    currentThought,
    onCurrentThoughtChange,
    selectedRange,
    editingThought,
    viewingThoughts,
    onSave,
    onEdit,
    onDelete,
    onAddAnother,
}: ThoughtDrawerProps) {
    const isViewing = viewingThoughts.length > 0 && !editingThought;
    const isEditing = !!editingThought;

    const getTitle = () => {
        if (isEditing) {
            return 'Edit Thought';
        }
        if (isViewing) {
            return `Viewing ${viewingThoughts.length} Thought${viewingThoughts.length > 1 ? 's' : ''}`;
        }
        return 'Add Thought';
    };

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>{getTitle()}</DrawerTitle>
                    <DrawerDescription>
                        {selectedRange && (
                            <span className="font-mono text-sm">
                                "
                                {selectedRange.text.length > 100
                                    ? `${selectedRange.text.slice(0, 100)}...`
                                    : selectedRange.text}
                                "
                            </span>
                        )}
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4">
                    {isViewing ? (
                        <MultipleThoughtsDisplay
                            thoughts={viewingThoughts}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddAnother={onAddAnother}
                        />
                    ) : (
                        <ThoughtEditor
                            value={currentThought}
                            onChange={onCurrentThoughtChange}
                            onSave={onSave}
                            onCancel={() => onOpenChange(false)}
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
    );
}
