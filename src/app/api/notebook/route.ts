import fs from 'node:fs/promises';
import path from 'node:path';
import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { decrypt, encrypt } from '@/lib/security';

const NOTEBOOK_DIR = path.join(process.cwd(), 'public', 'notebooks');

// Ensure notebooks directory exists
async function ensureNotebooksDir() {
    try {
        await fs.mkdir(NOTEBOOK_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating notebooks directory:', error);
    }
}

// Get user-specific notebook path
function getUserNotebookPath(userId: string): string {
    return path.join(NOTEBOOK_DIR, `${userId}.json`);
}

export async function GET(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await ensureNotebooksDir();
        const notebookPath = getUserNotebookPath(userId);
        const encryptionKey = request.headers.get('x-encryption-key');

        const data = await fs.readFile(notebookPath, 'utf-8');
        const parsed = JSON.parse(data);

        // If the data is encrypted but no key provided
        if (parsed.encrypted && !encryptionKey) {
            return NextResponse.json({ encrypted: true, poems: [] });
        }

        // If the data is encrypted and key is provided, decrypt it
        if (parsed.encrypted && encryptionKey) {
            try {
                const decryptedData = decrypt(parsed.data, encryptionKey);
                const notebook = JSON.parse(decryptedData);
                return NextResponse.json({ ...notebook, encrypted: false });
            } catch {
                return NextResponse.json({ error: 'Invalid encryption key' }, { status: 401 });
            }
        }

        // Data is not encrypted
        return NextResponse.json(parsed);
    } catch {
        // Return empty notebook if file doesn't exist
        return NextResponse.json({ poems: [] });
    }
}

export async function POST(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await ensureNotebooksDir();
        const notebookPath = getUserNotebookPath(userId);
        const { data, encryptionKey } = await request.json();

        let dataToSave;

        if (encryptionKey) {
            // Encrypt the data
            const jsonData = JSON.stringify(data, null, 2);
            const encryptedData = encrypt(jsonData, encryptionKey);
            dataToSave = { encrypted: true, data: encryptedData };
        } else {
            dataToSave = data;
        }

        await fs.writeFile(notebookPath, JSON.stringify(dataToSave, null, 2));

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
