import clientPromise from '@/lib/mongodb';

export interface NotebookDocument {
    userId: string;
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

export async function getNotebook(userId: string): Promise<NotebookDocument | null> {
    const collection = await getNotebookCollection();
    return await collection.findOne({ userId });
}

export async function upsertNotebook(userId: string, data: Partial<NotebookDocument>): Promise<void> {
    const collection = await getNotebookCollection();
    await collection.updateOne(
        { userId },
        { $set: { ...data, updatedAt: new Date() }, $setOnInsert: { userId, createdAt: new Date() } },
        { upsert: true },
    );
}
