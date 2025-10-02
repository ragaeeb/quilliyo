import type { SupabaseClient } from '@supabase/supabase-js';
import type { Poem } from '@/types/notebook';

/**
 * Prepares the data structure for saving to the database
 */
export function prepareNotebookData(
    data: { poems: Poem[] },
    encryptionKey: string | null,
    encrypt: (data: string, key: string) => string,
): { encrypted: boolean; data?: string | null; poems?: Poem[] | null } {
    if (encryptionKey) {
        // Encrypt: store in 'data' field, clear 'poems'
        const jsonData = JSON.stringify(data, null, 2);
        const encryptedData = encrypt(jsonData, encryptionKey);
        return { data: encryptedData, encrypted: true, poems: null };
    } else {
        // Unencrypted: store in 'poems' field, clear 'data'
        return { data: null, encrypted: false, poems: data.poems };
    }
}

/**
 * Identifies poems whose content has changed
 */
export function findChangedPoems(newPoems: Poem[], existingPoems: Poem[]): Poem[] {
    const changedPoems: Poem[] = [];

    for (const poem of newPoems) {
        const existingPoem = existingPoems.find((p) => p.id === poem.id);
        const contentChanged = !existingPoem || existingPoem.content !== poem.content;

        if (contentChanged && poem.content) {
            changedPoems.push(poem);
        }
    }

    return changedPoems;
}

/**
 * Identifies poem IDs that have been deleted
 */
export function findDeletedPoemIds(existingPoems: Poem[], newPoems: Poem[]): string[] {
    const existingPoemIds = new Set(existingPoems.map((p) => p.id));
    const newPoemIds = new Set(newPoems.map((p) => p.id));
    return [...existingPoemIds].filter((id) => !newPoemIds.has(id));
}

/**
 * Creates revision records for changed poems
 */
export function prepareRevisionInserts(changedPoems: Poem[], userId: string, notebookId: string) {
    return changedPoems.map((poem) => ({
        content: poem.content,
        notebook_id: notebookId,
        poem_id: poem.id,
        title: poem.title || 'Untitled',
        user_id: userId,
    }));
}

/**
 * Deletes revisions for poems that have been removed from the notebook
 */
export async function deleteRevisionsForDeletedPoems(
    supabase: SupabaseClient,
    userId: string,
    notebookId: string,
    deletedPoemIds: string[],
): Promise<void> {
    if (deletedPoemIds.length === 0) {
        return;
    }

    const { error } = await supabase
        .from('poem_content_revisions')
        .delete()
        .eq('user_id', userId)
        .eq('notebook_id', notebookId)
        .in('poem_id', deletedPoemIds);

    if (error) {
        console.error('Failed to delete revisions for deleted poems:', error);
        throw error;
    }
}

/**
 * Inserts new revision records
 */
export async function insertRevisions(
    supabase: SupabaseClient,
    revisionInserts: Array<{ content: string; notebook_id: string; poem_id: string; title: string; user_id: string }>,
): Promise<void> {
    if (revisionInserts.length === 0) {
        return;
    }

    const { error } = await supabase.from('poem_content_revisions').insert(revisionInserts);

    if (error) {
        console.error('Failed to insert revisions:', error);
        throw error;
    }
}

/**
 * Upserts the notebook data
 */
export async function upsertNotebookData(
    supabase: SupabaseClient,
    userId: string,
    notebookId: string,
    dataToSave: { encrypted: boolean; data?: string | null; poems?: Poem[] | null },
): Promise<void> {
    const { error } = await supabase
        .from('notebooks')
        .upsert({ ...dataToSave, notebook_id: notebookId, user_id: userId }, { onConflict: 'user_id,notebook_id' });

    if (error) {
        console.error('Failed to upsert notebook:', error);
        throw error;
    }
}
