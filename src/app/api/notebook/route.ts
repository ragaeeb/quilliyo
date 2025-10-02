import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_NOTEBOOK_ID, getNotebook } from '@/lib/models/notebook';
import { decrypt, encrypt } from '@/lib/security';
import { createClient } from '@/lib/supabase/server';

const authenticateRequest = async () => {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (!user) {
        if (authError) {
            console.error('Authentication error:', authError);
        }
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
    }

    return { error: null, user };
};

export async function GET(request: NextRequest) {
    const { user, error } = await authenticateRequest();

    if (error) {
        return error;
    }

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
}

export async function POST(request: NextRequest) {
    const { user, error } = await authenticateRequest();

    if (error) {
        return error;
    }

    const supabase = await createClient();

    try {
        const { data, encryptionKey, notebookId } = await request.json();
        const targetNotebookId = notebookId || DEFAULT_NOTEBOOK_ID;

        // Get existing notebook to compare content changes
        const existingNotebook = await getNotebook(user.id, targetNotebookId);
        const existingPoems = existingNotebook?.poems || [];

        let dataToSave: { encrypted: boolean; data?: string | null; poems?: Array<any> | null };

        if (encryptionKey) {
            // Encrypt: store in 'data' field, clear 'poems'
            const jsonData = JSON.stringify(data, null, 2);
            const encryptedData = encrypt(jsonData, encryptionKey);
            dataToSave = {
                data: encryptedData,
                encrypted: true,
                poems: null, // Clear unencrypted poems
            };
        } else {
            // Unencrypted: store in 'poems' field, clear 'data'
            dataToSave = {
                data: null, // Clear encrypted data
                encrypted: false,
                poems: data.poems,
            };
        }

        // Prepare revision inserts for poems with changed content
        const poems = data.poems || [];
        const revisionInserts = [];

        for (const poem of poems) {
            const existingPoem = existingPoems.find((p) => p.id === poem.id);
            const contentChanged = !existingPoem || existingPoem.content !== poem.content;

            if (contentChanged && poem.content) {
                revisionInserts.push({
                    content: poem.content,
                    notebook_id: targetNotebookId,
                    poem_id: poem.id,
                    title: poem.title || 'Untitled',
                    user_id: user.id,
                });
            }
        }

        // Execute notebook upsert and revision inserts in parallel
        const notebookOperation = supabase
            .from('notebooks')
            .upsert(
                { ...dataToSave, notebook_id: targetNotebookId, user_id: user.id },
                { onConflict: 'user_id,notebook_id' },
            );

        const operations = [notebookOperation];

        if (revisionInserts.length > 0) {
            operations.push(supabase.from('poem_content_revisions').insert(revisionInserts));
        }

        const results = await Promise.all(operations);

        // Check for errors
        for (const result of results) {
            if (result.error) {
                throw result.error;
            }
        }

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error saving notebook:', error);
        return NextResponse.json({ error: String(error), success: false }, { status: 500 });
    }
}
