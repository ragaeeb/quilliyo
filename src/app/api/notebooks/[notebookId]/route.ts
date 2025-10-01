import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { deleteNotebook, getNotebook, updateNotebookMetadata, upsertNotebook } from '@/lib/models/notebook';
import { decrypt, encrypt } from '@/lib/security';

export async function GET(request: NextRequest, { params }: { params: { notebookId: string } }) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const encryptionKey = request.headers.get('x-encryption-key');
        const notebookId = params.notebookId;

        const notebook = await getNotebook(userId, notebookId);

        if (!notebook) {
            return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
        }

        // If the data is encrypted but no key provided
        if (notebook.encrypted && !encryptionKey) {
            return NextResponse.json({ encrypted: true, poems: [] });
        }

        // If the data is encrypted and key is provided, decrypt it
        if (notebook.encrypted && encryptionKey && notebook.data) {
            try {
                const decryptedData = decrypt(notebook.data, encryptionKey);
                const notebookData = JSON.parse(decryptedData);
                return NextResponse.json({ ...notebookData, encrypted: false });
            } catch {
                return NextResponse.json({ error: 'Invalid encryption key' }, { status: 401 });
            }
        }

        // Data is not encrypted
        return NextResponse.json({
            poems: notebook.poems || [],
            name: notebook.name,
            description: notebook.description,
        });
    } catch (error) {
        console.error('Error fetching notebook:', error);
        return NextResponse.json({ error: 'Failed to fetch notebook' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { notebookId: string } }) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notebookId = params.notebookId;
        const { data, encryptionKey } = await request.json();

        let dataToSave: { encrypted: boolean; data?: string; poems?: Array<any> };

        if (encryptionKey) {
            // Encrypt the data
            const jsonData = JSON.stringify(data, null, 2);
            const encryptedData = encrypt(jsonData, encryptionKey);
            dataToSave = { encrypted: true, data: encryptedData };
        } else {
            dataToSave = { encrypted: false, poems: data.poems };
        }

        await upsertNotebook(userId, notebookId, dataToSave);

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error saving notebook:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { notebookId: string } }) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notebookId = params.notebookId;
        const { name, description } = await request.json();

        await updateNotebookMetadata(userId, notebookId, { name, description });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating notebook metadata:', error);
        return NextResponse.json({ error: 'Failed to update notebook' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: { notebookId: string } }) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notebookId = params.notebookId;
        await deleteNotebook(userId, notebookId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting notebook:', error);
        return NextResponse.json({ error: 'Failed to delete notebook' }, { status: 500 });
    }
}
