import type { User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/authMiddleware';
import { DEFAULT_NOTEBOOK_ID } from '@/lib/models/notebook';
import { getRevision, getRevisionsList } from '@/lib/models/revisions';

const getRevisionsHandler = async (request: NextRequest, { user }: { user: User }) => {
    try {
        const searchParams = request.nextUrl.searchParams;
        const notebookId = searchParams.get('notebookId') || DEFAULT_NOTEBOOK_ID;
        const poemId = searchParams.get('poemId');
        const revisionNumber = searchParams.get('revisionNumber');

        if (!poemId) {
            return NextResponse.json({ error: 'poemId is required' }, { status: 400 });
        }

        // If revisionNumber is provided, fetch specific revision
        if (revisionNumber) {
            const revNum = parseInt(revisionNumber, 10);
            if (Number.isNaN(revNum) || revNum < 1) {
                return NextResponse.json({ error: 'Invalid revisionNumber' }, { status: 400 });
            }
            const revision = await getRevision(user.id, notebookId, poemId, revNum);

            if (!revision) {
                return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
            }

            return NextResponse.json({ revision });
        }

        // Otherwise, fetch list of revisions
        const revisions = await getRevisionsList(user.id, notebookId, poemId);

        return NextResponse.json({ revisions });
    } catch (error) {
        console.error('Error fetching revisions:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }
};

export const GET = withAuth(getRevisionsHandler);
