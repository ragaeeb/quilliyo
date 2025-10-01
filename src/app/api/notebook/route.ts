import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getNotebook, upsertNotebook } from '@/lib/models/notebook';
import { decrypt, encrypt } from '@/lib/security';

export async function GET(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const encryptionKey = request.headers.get('x-encryption-key');
        const notebook = await getNotebook(userId);

        if (!notebook) {
            // Return empty notebook if doesn't exist
            return NextResponse.json({ poems: [] });
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
        return NextResponse.json({ poems: notebook.poems || [] });
    } catch (error) {
        console.error('Error fetching notebook:', error);
        return NextResponse.json({ error: 'Failed to fetch notebook' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
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

        await upsertNotebook(userId, dataToSave);

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error saving notebook:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
