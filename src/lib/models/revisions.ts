import { createClient } from '@/lib/supabase/server';
import type { PoemRevision, RevisionListItem } from '@/types/notebook';

export async function getRevisionsList(
    userId: string,
    notebookId: string,
    poemId: string,
): Promise<RevisionListItem[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('poem_content_revisions')
        .select('revision_number, title, created_at, content')
        .eq('user_id', userId)
        .eq('notebook_id', notebookId)
        .eq('poem_id', poemId)
        .order('revision_number', { ascending: false });

    if (error) {
        throw error;
    }

    // Transform to list items with preview
    return (data || []).map((revision) => ({
        created_at: revision.created_at,
        preview: revision.content.slice(0, 100),
        revision_number: revision.revision_number,
        title: revision.title,
    }));
}

export async function getRevision(
    userId: string,
    notebookId: string,
    poemId: string,
    revisionNumber: number,
): Promise<PoemRevision | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('poem_content_revisions')
        .select('*')
        .eq('user_id', userId)
        .eq('notebook_id', notebookId)
        .eq('poem_id', poemId)
        .eq('revision_number', revisionNumber)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;
}
