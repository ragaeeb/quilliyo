import { createClient } from '@/lib/supabase/server';

export const DEFAULT_NOTEBOOK_ID = 'default';

export interface NotebookDocument {
    id: string;
    user_id: string;
    notebook_id: string;
    encrypted?: boolean;
    data?: string | null; // encrypted data - can be null when unencrypted
    poems?: Array<{
        id: string;
        title: string;
        content: string;
        lastUpdatedOn: string;
        tags?: string[];
        category?: string;
        chapter?: string;
    }> | null; // can be null when encrypted
    updated_at: string;
    created_at: string;
}

export async function getNotebook(
    userId: string,
    notebookId: string = DEFAULT_NOTEBOOK_ID,
): Promise<NotebookDocument | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('user_id', userId)
        .eq('notebook_id', notebookId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;
}

export async function upsertNotebook(
    userId: string,
    data: Partial<Omit<NotebookDocument, 'id' | 'user_id' | 'notebook_id' | 'created_at' | 'updated_at'>>,
    notebookId: string = DEFAULT_NOTEBOOK_ID,
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('notebooks')
        .upsert({ ...data, notebook_id: notebookId, user_id: userId }, { onConflict: 'user_id,notebook_id' });

    if (error) {
        throw error;
    }
}

export async function listNotebooks(userId: string): Promise<NotebookDocument[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
}

export async function deleteNotebook(userId: string, notebookId: string): Promise<void> {
    if (notebookId === DEFAULT_NOTEBOOK_ID) {
        throw new Error('Cannot delete the default notebook');
    }

    const supabase = await createClient();

    const { error } = await supabase.from('notebooks').delete().eq('user_id', userId).eq('notebook_id', notebookId);

    if (error) {
        throw error;
    }
}
