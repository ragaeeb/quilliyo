'use client';

import { format } from 'date-fns';
import Fuse from 'fuse.js';
import { Check, ChevronsUpDown, Plus, Save, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import type { Notebook, Poem } from '@/types/notebook';

function Combobox({
    options,
    value,
    onChange,
    placeholder,
}: {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedValue, setSelectedValue] = useState(value);

    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    const filteredOptions = options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="mt-1.5 w-full justify-between"
                >
                    {selectedValue || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder={`Search or type new...`} value={search} onValueChange={setSearch} />
                    <CommandList>
                        <CommandEmpty>
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => {
                                    if (search) {
                                        setSelectedValue(search);
                                        onChange(search);
                                        setOpen(false);
                                        setSearch('');
                                    }
                                }}
                            >
                                Create "{search}"
                            </Button>
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={(currentValue) => {
                                        setSelectedValue(currentValue);
                                        onChange(currentValue);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 ${selectedValue === option ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    {option}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function Home() {
    const [notebook, setNotebook] = useState<Notebook>({ poems: [] });
    const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [poemTags, setPoemTags] = useState<string[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Memoized values for optimization
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        notebook.poems.forEach((p) => {
            p.tags?.forEach((t) => tags.add(t));
        });
        return Array.from(tags);
    }, [notebook.poems]);

    const allCategories = useMemo(() => {
        const cats = new Set<string>();
        notebook.poems.forEach((p) => p.category && cats.add(p.category));
        return Array.from(cats);
    }, [notebook.poems]);

    const allChapters = useMemo(() => {
        const chaps = new Set<string>();
        notebook.poems.forEach((p) => p.chapter && chaps.add(p.chapter));
        return Array.from(chaps);
    }, [notebook.poems]);

    // Load notebook
    useEffect(() => {
        const loadNotebook = async () => {
            try {
                const res = await fetch('/api/notebook');
                const data = await res.json();

                setNotebook(data);
            } catch (error) {
                console.error('Failed to load notebook:', error);
            }
        };

        loadNotebook();
    }, []);

    // Search with debouncing
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Fuzzy search
    const filteredPoems = useMemo(() => {
        if (!debouncedSearch) return notebook.poems;

        const fuse = new Fuse(notebook.poems, { keys: ['title', 'content'], threshold: 0.3, includeScore: true });

        return fuse.search(debouncedSearch).map((result) => result.item);
    }, [notebook.poems, debouncedSearch]);

    const saveNotebook = async () => {
        try {
            const res = await fetch('/api/notebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: notebook }),
            });
            const result = await res.json();
            if (result.success) {
                setLastSaved(result.timestamp);
            }
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    const createNewPoem = () => {
        const newPoem: Poem = {
            id: Date.now().toString(),
            title: 'Untitled',
            content: '',
            lastUpdatedOn: new Date().toISOString(),
        };
        setSelectedPoem(newPoem);
        setPoemTags([]);
        setIsModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const category = formData.get('category') as string;
        const chapter = formData.get('chapter') as string;
        const createdOn = formData.get('createdOn') as string;
        const lastUpdatedOn = formData.get('lastUpdatedOn') as string;
        const tagsJson = formData.get('tags') as string;
        const tags = JSON.parse(tagsJson) as string[];

        const cleanPoem: Poem = {
            id: selectedPoem?.id || Date.now().toString(),
            title: title || 'Untitled',
            content: content || '',
        };

        // Only add optional fields if they have values
        if (tags.length > 0) cleanPoem.tags = tags;
        if (category) cleanPoem.category = category;
        if (chapter) cleanPoem.chapter = chapter;
        if (createdOn) cleanPoem.createdOn = new Date(createdOn).toISOString();
        if (lastUpdatedOn) {
            cleanPoem.lastUpdatedOn = new Date(lastUpdatedOn).toISOString();
        } else {
            cleanPoem.lastUpdatedOn = new Date().toISOString();
        }

        setNotebook((prev) => {
            const index = prev.poems.findIndex((p) => p.id === cleanPoem.id);
            const newPoems = [...prev.poems];
            if (index >= 0) {
                newPoems[index] = cleanPoem;
            } else {
                newPoems.push(cleanPoem);
            }
            return { ...prev, poems: newPoems };
        });

        setIsModalOpen(false);
        setSelectedPoem(null);
        setPoemTags([]);
    };

    const deleteSelected = () => {
        setNotebook((prev) => ({ ...prev, poems: prev.poems.filter((p) => !selectedIds.has(p.id)) }));
        setSelectedIds(new Set());
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <div className="container mx-auto p-8">
            <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="font-bold text-3xl">Notebook</h1>
                    <div className="flex items-center gap-2">
                        {lastSaved && (
                            <span className="text-gray-500 text-sm">
                                Last saved: {format(new Date(lastSaved), 'HH:mm:ss')}
                            </span>
                        )}
                        <Button onClick={saveNotebook} size="sm">
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                        <Input
                            placeholder="Search poems..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={createNewPoem}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Poem
                    </Button>
                    {selectedIds.size > 0 && (
                        <Button onClick={deleteSelected} variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPoems.map((poem) => (
                    <Card key={poem.id} className="cursor-pointer transition-shadow hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <Checkbox
                                    checked={selectedIds.has(poem.id)}
                                    onCheckedChange={() => toggleSelect(poem.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <CardTitle
                                    className="ml-3 flex-1"
                                    onClick={() => {
                                        setSelectedPoem(poem);
                                        setPoemTags(poem.tags || []);
                                        setIsModalOpen(true);
                                    }}
                                >
                                    {poem.title}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent
                            onClick={() => {
                                setSelectedPoem(poem);
                                setPoemTags(poem.tags || []);
                                setIsModalOpen(true);
                            }}
                        >
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
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] gap-0 p-0">
                    <DialogHeader className="border-b px-6 pt-6 pb-4">
                        <DialogTitle>Edit Poem</DialogTitle>
                    </DialogHeader>
                    {selectedPoem && (
                        <form onSubmit={handleFormSubmit} className="flex h-[calc(95vh-80px)] flex-col">
                            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        defaultValue={selectedPoem.title}
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="content">Content</Label>
                                    <Textarea
                                        id="content"
                                        name="content"
                                        defaultValue={selectedPoem.content}
                                        rows={15}
                                        className="mt-1.5 min-h-[400px] font-mono"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="category">Category</Label>
                                        <Combobox
                                            options={allCategories}
                                            value={selectedPoem.category || ''}
                                            onChange={(value) => {
                                                // This will be handled by the form submission
                                                const input = document.getElementById('category') as HTMLInputElement;
                                                if (input) input.value = value;
                                            }}
                                            placeholder="Select or create category"
                                        />
                                        <input
                                            type="hidden"
                                            id="category"
                                            name="category"
                                            defaultValue={selectedPoem.category || ''}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="chapter">Chapter</Label>
                                        <Combobox
                                            options={allChapters}
                                            value={selectedPoem.chapter || ''}
                                            onChange={(value) => {
                                                const input = document.getElementById('chapter') as HTMLInputElement;
                                                if (input) input.value = value;
                                            }}
                                            placeholder="Select or create chapter"
                                        />
                                        <input
                                            type="hidden"
                                            id="chapter"
                                            name="chapter"
                                            defaultValue={selectedPoem.chapter || ''}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Tags</Label>
                                    <div className="mt-1.5 mb-2 flex flex-wrap gap-1.5">
                                        {poemTags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={() => setPoemTags(poemTags.filter((t) => t !== tag))}
                                            >
                                                {tag} ×
                                            </Badge>
                                        ))}
                                    </div>
                                    <Input
                                        id="tagInput"
                                        list="tags"
                                        placeholder="Add tag (press Enter)"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const value = e.currentTarget.value.trim();
                                                if (value && !poemTags.includes(value)) {
                                                    setPoemTags([...poemTags, value]);
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <datalist id="tags">
                                        {allTags.map((tag) => (
                                            <option key={tag} value={tag} />
                                        ))}
                                    </datalist>
                                    <input type="hidden" name="tags" value={JSON.stringify(poemTags)} />
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
                                                selectedPoem.createdOn
                                                    ? new Date(selectedPoem.createdOn).toISOString().split('T')[0]
                                                    : ''
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
                                                selectedPoem.lastUpdatedOn
                                                    ? new Date(selectedPoem.lastUpdatedOn).toISOString().split('T')[0]
                                                    : ''
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
