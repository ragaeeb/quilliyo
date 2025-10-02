import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_NOTEBOOK_ID, getNotebook, upsertNotebook } from '@/lib/models/notebook';
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

    try {
        const { data, encryptionKey, notebookId } = await request.json();
        const targetNotebookId = notebookId || DEFAULT_NOTEBOOK_ID;

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

        await upsertNotebook(user.id, dataToSave, targetNotebookId);

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error saving notebook:', error);
        return NextResponse.json({ error: String(error), success: false }, { status: 500 });
    }
}
