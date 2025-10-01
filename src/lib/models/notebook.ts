import type { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export interface NotebookDocument {
    _id?: ObjectId;
    userId: string;
    notebookId: string; // slug-friendly ID like "my-poetry-collection"
    name: string; // Display name like "My Poetry Collection"
    description?: string;
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
    const collection = db.collection<NotebookDocument>('notebooks');

    // Create compound unique index on userId + notebookId
    await collection.createIndex({ userId: 1, notebookId: 1 }, { unique: true });

    // Create index for listing user's notebooks
    await collection.createIndex({ userId: 1, updatedAt: -1 });

    return collection;
}

export async function getNotebook(userId: string, notebookId: string): Promise<NotebookDocument | null> {
    const collection = await getNotebookCollection();
    return await collection.findOne({ userId, notebookId });
}

export async function listNotebooks(userId: string): Promise<NotebookDocument[]> {
    const collection = await getNotebookCollection();
    return await collection.find({ userId }).sort({ updatedAt: -1 }).toArray();
}

export async function createNotebook(
    userId: string,
    notebookId: string,
    name: string,
    description?: string,
): Promise<NotebookDocument> {
    const collection = await getNotebookCollection();

    const notebook: NotebookDocument = {
        userId,
        notebookId,
        name,
        description,
        encrypted: false,
        poems: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await collection.insertOne(notebook);
    return notebook;
}

export async function upsertNotebook(
    userId: string,
    notebookId: string,
    data: Partial<NotebookDocument>,
): Promise<void> {
    const collection = await getNotebookCollection();
    await collection.updateOne(
        { userId, notebookId },
        {
            $set: { ...data, updatedAt: new Date() },
            $setOnInsert: {
                userId,
                notebookId,
                name: notebookId, // fallback name
                createdAt: new Date(),
            },
        },
        { upsert: true },
    );
}

export async function deleteNotebook(userId: string, notebookId: string): Promise<void> {
    const collection = await getNotebookCollection();
    await collection.deleteOne({ userId, notebookId });
}

export async function updateNotebookMetadata(
    userId: string,
    notebookId: string,
    updates: { name?: string; description?: string },
): Promise<void> {
    const collection = await getNotebookCollection();
    await collection.updateOne({ userId, notebookId }, { $set: { ...updates, updatedAt: new Date() } });
}
