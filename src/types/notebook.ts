export interface Poem {
    id: string;
    title: string;
    content: string;
    tags?: string[];
    category?: string;
    chapter?: string;
    createdOn?: string;
    lastUpdatedOn?: string;
    metadata?: Record<string, string>;
}

export interface Notebook {
    poems: Poem[];
    encrypted?: boolean;
}
