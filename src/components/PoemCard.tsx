import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Poem } from '@/types/notebook';

interface PoemCardProps {
    poem: Poem;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onEdit: (poem: Poem) => void;
}

export const PoemCard = memo(function PoemCard({ poem, isSelected, onToggleSelect, onEdit }: PoemCardProps) {
    return (
        <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(poem.id)}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <CardTitle className="ml-3 flex-1" onClick={() => onEdit(poem)}>
                        {poem.title}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent onClick={() => onEdit(poem)}>
                <p className="mb-2 line-clamp-3 text-gray-600 text-sm">{poem.content}</p>
                <div className="flex flex-wrap gap-1">
                    {poem.category && <Badge variant="secondary">{poem.category}</Badge>}
                    {poem.tags?.map((tag) => (
                        <Badge key={tag} variant="outline">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
});
