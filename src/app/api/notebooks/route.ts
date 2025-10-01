import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createNotebook, listNotebooks } from '@/lib/models/notebook';

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notebooks = await listNotebooks(userId);
        return NextResponse.json({ notebooks });
    } catch (error) {
        console.error('Error listing notebooks:', error);
        return NextResponse.json({ error: 'Failed to list notebooks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { notebookId, name, description } = await request.json();

        if (!notebookId || !name) {
            return NextResponse.json({ error: 'notebookId and name are required' }, { status: 400 });
        }

        const notebook = await createNotebook(userId, notebookId, name, description);
        return NextResponse.json({ notebook }, { status: 201 });
    } catch (error: any) {
        // Handle duplicate key error
        if (error?.code === 11000) {
            return NextResponse.json({ error: 'Notebook with this ID already exists' }, { status: 409 });
        }
        console.error('Error creating notebook:', error);
        return NextResponse.json({ error: 'Failed to create notebook' }, { status: 500 });
    }
}
