import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';

const NOTEBOOK_PATH = path.join(process.cwd(), 'public', 'notebook.json');
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Derive a key from the password using PBKDF2
function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

// Encrypt data
function encrypt(data: string, password: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Combine salt + iv + authTag + encrypted data
    const result = Buffer.concat([salt, iv, authTag, encrypted]);
    return result.toString('base64');
}

// Decrypt data
function decrypt(encryptedData: string, password: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}

export async function GET(request: NextRequest) {
    try {
        const encryptionKey = request.headers.get('x-encryption-key');
        const data = await fs.readFile(NOTEBOOK_PATH, 'utf-8');
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
    try {
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

        await fs.writeFile(NOTEBOOK_PATH, JSON.stringify(dataToSave, null, 2));

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
