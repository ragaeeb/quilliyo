import clientPromise from '@/lib/mongodb';

export const DEFAULT_NOTEBOOK_ID = 'default';

export interface NotebookDocument {
    userId: string;
    notebookId: string; // NEW: identifier for the notebook
    encrypted?: boolean;
    data?: string; // encrypted data
    poems?: Array<{
        id: string;
        title: string;
        content: string;
        lastUpdatedOn: string;
        tags?: string[];
        category?: string;
        chapter?: string;
    }>;
    updatedAt: Date;
    createdAt: Date;
}

export async function getNotebookCollection() {
    const client = await clientPromise;
    const db = client.db('quilliyo');
    return db.collection<NotebookDocument>('notebooks');
}

export async function getNotebook(
    userId: string,
    notebookId: string = DEFAULT_NOTEBOOK_ID,
): Promise<NotebookDocument | null> {
    const collection = await getNotebookCollection();
    return await collection.findOne({ userId, notebookId });
}

export async function upsertNotebook(
    userId: string,
    data: Partial<NotebookDocument>,
    notebookId: string = DEFAULT_NOTEBOOK_ID,
): Promise<void> {
    const collection = await getNotebookCollection();
    await collection.updateOne(
        { userId, notebookId },
        { $set: { ...data, updatedAt: new Date() }, $setOnInsert: { userId, notebookId, createdAt: new Date() } },
        { upsert: true },
    );
}

// NEW: Helper functions for future multi-notebook support
export async function listNotebooks(userId: string): Promise<NotebookDocument[]> {
    const collection = await getNotebookCollection();
    return await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function deleteNotebook(userId: string, notebookId: string): Promise<void> {
    if (notebookId === DEFAULT_NOTEBOOK_ID) {
        throw new Error('Cannot delete the default notebook');
    }
    const collection = await getNotebookCollection();
    await collection.deleteOne({ userId, notebookId });
}
