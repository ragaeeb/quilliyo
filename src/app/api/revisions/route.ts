import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_NOTEBOOK_ID } from '@/lib/models/notebook';
import { getRevision, getRevisionsList } from '@/lib/models/revisions';
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
        const searchParams = request.nextUrl.searchParams;
        const notebookId = searchParams.get('notebookId') || DEFAULT_NOTEBOOK_ID;
        const poemId = searchParams.get('poemId');
        const revisionNumber = searchParams.get('revisionNumber');

        if (!poemId) {
            return NextResponse.json({ error: 'poemId is required' }, { status: 400 });
        }

        // If revisionNumber is provided, fetch specific revision
        if (revisionNumber) {
            const revision = await getRevision(user.id, notebookId, poemId, parseInt(revisionNumber, 10));

            if (!revision) {
                return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
            }

            return NextResponse.json({ revision });
        }

        // Otherwise, fetch list of revisions
        const revisions = await getRevisionsList(user.id, notebookId, poemId);

        return NextResponse.json({ revisions });
    } catch (error) {
        console.error('Error fetching revisions:', error);
        return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }
}
