import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/authMiddleware';
import { DEFAULT_NOTEBOOK_ID, getNotebook } from '@/lib/models/notebook';
import {
    deleteRevisionsForDeletedPoems,
    findChangedPoems,
    findDeletedPoemIds,
    insertRevisions,
    prepareNotebookData,
    prepareRevisionInserts,
    upsertNotebookData,
} from '@/lib/notebookSaveUtils';
import { decrypt, encrypt } from '@/lib/security';

const getNotebookHandler = async (request: NextRequest, { user }: { user: any }) => {
    try {
        const encryptionKey = request.headers.get('x-encryption-key');
        const notebookId = request.nextUrl.searchParams.get('notebookId') || DEFAULT_NOTEBOOK_ID;

        const notebook = await getNotebook(user.id, notebookId);

        if (!notebook) {
            return NextResponse.json({ poems: [] });
        }

        // If encrypted but no key provided, tell client it needs the key
        if (notebook.encrypted && !encryptionKey) {
            return NextResponse.json({ encrypted: true, poems: [] });
        }

        // If encrypted and key provided, decrypt
        if (notebook.encrypted && encryptionKey && notebook.data) {
            try {
                const decryptedData = decrypt(notebook.data, encryptionKey);
                const notebookData = JSON.parse(decryptedData);
                return NextResponse.json({ ...notebookData, encrypted: false });
            } catch {
                return NextResponse.json({ error: 'Invalid encryption key' }, { status: 401 });
            }
        }

        // Not encrypted, return poems directly
        return NextResponse.json({ poems: notebook.poems || [] });
    } catch (error) {
        console.error('Error fetching notebook:', error);
        return NextResponse.json({ error: 'Failed to fetch notebook' }, { status: 500 });
    }
};

const saveNotebookHandler = async (request: NextRequest, { user, supabase }: { user: any; supabase: any }) => {
    try {
        const { data, encryptionKey, notebookId } = await request.json();
        const targetNotebookId = notebookId || DEFAULT_NOTEBOOK_ID;

        // Get existing notebook for comparison
        const existingNotebook = await getNotebook(user.id, targetNotebookId);
        const existingPoems = existingNotebook?.poems || [];
        const newPoems = data.poems || [];

        // Prepare notebook data (encrypted or unencrypted)
        const dataToSave = prepareNotebookData(data, encryptionKey, encrypt);

        // Find poems that have been deleted
        const deletedPoemIds = findDeletedPoemIds(existingPoems, newPoems);

        // Find poems with changed content
        const changedPoems = findChangedPoems(newPoems, existingPoems);

        // Prepare revision inserts
        const revisionInserts = prepareRevisionInserts(changedPoems, user.id, targetNotebookId);

        // Execute all operations
        await Promise.all([
            // Delete revisions for removed poems
            deleteRevisionsForDeletedPoems(supabase, user.id, targetNotebookId, deletedPoemIds),
            // Insert new revisions
            insertRevisions(supabase, revisionInserts),
            // Save notebook
            upsertNotebookData(supabase, user.id, targetNotebookId, dataToSave),
        ]);

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error saving notebook:', error);
        return NextResponse.json({ error: String(error), success: false }, { status: 500 });
    }
};

export const GET = withAuth(getNotebookHandler);
export const POST = withAuth(saveNotebookHandler);
