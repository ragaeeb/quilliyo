import fs from 'node:fs/promises';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';

const NOTEBOOK_PATH = path.join(process.cwd(), 'public', 'notebook.json');

export async function GET() {
    try {
        const data = await fs.readFile(NOTEBOOK_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch {
        // Return empty notebook if file doesn't exist
        return NextResponse.json({ poems: [] });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { data } = await request.json();

        await fs.writeFile(NOTEBOOK_PATH, JSON.stringify(data, null, 2));

        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
