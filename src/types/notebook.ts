export type PoemMetadata = { urls?: string[]; thoughts?: Thought[] };

export type Poem = {
    id: string;
    title: string;
    content: string;
    tags?: string[];
    category?: string;
    chapter?: string;
    createdOn?: string;
    lastUpdatedOn?: string;
    metadata?: PoemMetadata;
};

export type Notebook = { poems: Poem[]; encrypted?: boolean };

export type Thought = {
    id: string;
    text: string;
    selectedText: string;
    startIndex: number;
    endIndex: number;
    createdAt: string;
};

export type PoemRevision = Pick<Poem, 'content' | 'title'> & {
    id: string;
    user_id: string;
    notebook_id: string;
    poem_id: string;
    revision_number: number;
    created_at: string;
};

export type RevisionListItem = {
    revision_number: number;
    title: string;
    created_at: string;
    preview: string; // First 100 chars of content
};
