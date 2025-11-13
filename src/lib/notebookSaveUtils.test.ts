import { describe, expect, it, vi } from 'vitest';
import {
    deleteRevisionsForDeletedPoems,
    findChangedPoems,
    findDeletedPoemIds,
    insertRevisions,
    prepareNotebookData,
    prepareRevisionInserts,
    upsertNotebookData,
} from '@/lib/notebookSaveUtils';
import type { Poem } from '@/types/notebook';

describe('prepareNotebookData', () => {
    it('should encrypt data when encryptionKey is provided', () => {
        const data = { poems: [{ content: 'Hello', id: '1', title: 'Test' }] };
        const encryptionKey = 'test-key';
        const mockEncrypt = vi.fn((data: string, key: string) => `encrypted:${data}`);

        const result = prepareNotebookData(data, encryptionKey, mockEncrypt);

        expect(result.encrypted).toBe(true);
        expect(result.poems).toBe(null);
        expect(result.data).toContain('encrypted:');
        expect(mockEncrypt).toHaveBeenCalledTimes(1);
    });

    it('should not encrypt data when encryptionKey is null', () => {
        const data = { poems: [{ content: 'Hello', id: '1', title: 'Test' }] };
        const mockEncrypt = vi.fn(() => 'encrypted');

        const result = prepareNotebookData(data, null, mockEncrypt);

        expect(result.encrypted).toBe(false);
        expect(result.data).toBe(null);
        expect(result.poems).toEqual(data.poems);
        expect(mockEncrypt).not.toHaveBeenCalled();
    });
});

describe('findChangedPoems', () => {
    it('should identify poems with changed content', () => {
        const existingPoems: Poem[] = [
            { content: 'Original content', id: '1', title: 'Poem 1' },
            { content: 'Unchanged', id: '2', title: 'Poem 2' },
        ];

        const newPoems: Poem[] = [
            { content: 'Modified content', id: '1', title: 'Poem 1' },
            { content: 'Unchanged', id: '2', title: 'Poem 2' },
        ];

        const result = findChangedPoems(newPoems, existingPoems);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
        expect(result[0].content).toBe('Modified content');
    });

    it('should identify new poems as changed', () => {
        const existingPoems: Poem[] = [{ content: 'Content', id: '1', title: 'Poem 1' }];

        const newPoems: Poem[] = [
            { content: 'Content', id: '1', title: 'Poem 1' },
            { content: 'New poem', id: '2', title: 'Poem 2' },
        ];

        const result = findChangedPoems(newPoems, existingPoems);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
    });

    it('should not include poems with empty content', () => {
        const existingPoems: Poem[] = [];
        const newPoems: Poem[] = [
            { content: '', id: '1', title: 'Poem 1' },
            { content: 'Has content', id: '2', title: 'Poem 2' },
        ];

        const result = findChangedPoems(newPoems, existingPoems);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
    });

    it('should return empty array when no poems changed', () => {
        const poems: Poem[] = [{ content: 'Content', id: '1', title: 'Poem 1' }];

        const result = findChangedPoems(poems, poems);

        expect(result).toHaveLength(0);
    });
});

describe('findDeletedPoemIds', () => {
    it('should identify deleted poem IDs', () => {
        const existingPoems: Poem[] = [
            { content: 'Content 1', id: '1', title: 'Poem 1' },
            { content: 'Content 2', id: '2', title: 'Poem 2' },
            { content: 'Content 3', id: '3', title: 'Poem 3' },
        ];

        const newPoems: Poem[] = [
            { content: 'Content 1', id: '1', title: 'Poem 1' },
            { content: 'Content 3', id: '3', title: 'Poem 3' },
        ];

        const result = findDeletedPoemIds(existingPoems, newPoems);

        expect(result).toHaveLength(1);
        expect(result).toContain('2');
    });

    it('should return empty array when no poems deleted', () => {
        const poems: Poem[] = [{ content: 'Content', id: '1', title: 'Poem 1' }];

        const result = findDeletedPoemIds(poems, poems);

        expect(result).toHaveLength(0);
    });

    it('should return all IDs when all poems deleted', () => {
        const existingPoems: Poem[] = [
            { content: 'Content 1', id: '1', title: 'Poem 1' },
            { content: 'Content 2', id: '2', title: 'Poem 2' },
        ];

        const result = findDeletedPoemIds(existingPoems, []);

        expect(result).toHaveLength(2);
        expect(result).toContain('1');
        expect(result).toContain('2');
    });

    it('should handle new poems being added (not deleted)', () => {
        const existingPoems: Poem[] = [{ content: 'Content 1', id: '1', title: 'Poem 1' }];

        const newPoems: Poem[] = [
            { content: 'Content 1', id: '1', title: 'Poem 1' },
            { content: 'Content 2', id: '2', title: 'Poem 2' },
        ];

        const result = findDeletedPoemIds(existingPoems, newPoems);

        expect(result).toHaveLength(0);
    });
});

describe('prepareRevisionInserts', () => {
    it('should prepare revision inserts with correct structure', () => {
        const changedPoems: Poem[] = [
            { content: 'Content 1', id: '1', title: 'Poem 1' },
            { content: 'Content 2', id: '2', title: 'Poem 2' },
        ];

        const result = prepareRevisionInserts(changedPoems, 'user-123', 'notebook-456');

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            content: 'Content 1',
            notebook_id: 'notebook-456',
            poem_id: '1',
            title: 'Poem 1',
            user_id: 'user-123',
        });
    });

    it('should use "Untitled" for poems without titles', () => {
        const changedPoems: Poem[] = [{ content: 'Content', id: '1', title: '' }];

        const result = prepareRevisionInserts(changedPoems, 'user-123', 'notebook-456');

        expect(result[0].title).toBe('Untitled');
    });

    it('should return empty array for no changed poems', () => {
        const result = prepareRevisionInserts([], 'user-123', 'notebook-456');

        expect(result).toHaveLength(0);
    });
});

describe('deleteRevisionsForDeletedPoems', () => {
    it('should not call delete when no poems deleted', async () => {
        const mockSupabase = { from: vi.fn(() => ({ delete: vi.fn() })) } as any;

        await deleteRevisionsForDeletedPoems(mockSupabase, 'user-123', 'notebook-456', []);

        expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should throw error when delete fails', async () => {
        const mockSupabase = {
            from: () => ({
                delete: () => ({ eq: () => ({ eq: () => ({ in: () => ({ error: new Error('Delete failed') }) }) }) }),
            }),
        } as any;

        await expect(
            deleteRevisionsForDeletedPoems(mockSupabase, 'user-123', 'notebook-456', ['poem-1']),
        ).rejects.toThrow('Delete failed');
    });
});

describe('insertRevisions', () => {
    it('should call insert with correct parameters', async () => {
        const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
        const mockSupabase = { from: vi.fn(() => ({ insert: mockInsert })) } as any;

        const revisions = [
            { content: 'Content', notebook_id: 'notebook-456', poem_id: 'poem-1', title: 'Title', user_id: 'user-123' },
        ];

        await insertRevisions(mockSupabase, revisions);

        expect(mockSupabase.from).toHaveBeenCalledWith('poem_content_revisions');
        expect(mockInsert).toHaveBeenCalledWith(revisions);
    });

    it('should not call insert when no revisions provided', async () => {
        const mockSupabase = { from: vi.fn(() => ({ insert: vi.fn() })) } as any;

        await insertRevisions(mockSupabase, []);

        expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should throw error when insert fails', async () => {
        const mockSupabase = { from: () => ({ insert: () => ({ error: new Error('Insert failed') }) }) } as any;

        const revisions = [
            { content: 'Content', notebook_id: 'notebook-456', poem_id: 'poem-1', title: 'Title', user_id: 'user-123' },
        ];

        await expect(insertRevisions(mockSupabase, revisions)).rejects.toThrow('Insert failed');
    });
});

describe('upsertNotebookData', () => {
    it('should call upsert with correct parameters', async () => {
        const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));
        const mockSupabase = { from: vi.fn(() => ({ upsert: mockUpsert })) } as any;

        const dataToSave = { encrypted: false, poems: [{ content: 'Content', id: '1', title: 'Test' }] };

        await upsertNotebookData(mockSupabase, 'user-123', 'notebook-456', dataToSave);

        expect(mockSupabase.from).toHaveBeenCalledWith('notebooks');
        expect(mockUpsert).toHaveBeenCalledWith(
            { ...dataToSave, notebook_id: 'notebook-456', user_id: 'user-123' },
            { onConflict: 'user_id,notebook_id' },
        );
    });

    it('should throw error when upsert fails', async () => {
        const mockSupabase = { from: () => ({ upsert: () => ({ error: new Error('Upsert failed') }) }) } as any;

        const dataToSave = { encrypted: false, poems: [] };

        await expect(upsertNotebookData(mockSupabase, 'user-123', 'notebook-456', dataToSave)).rejects.toThrow(
            'Upsert failed',
        );
    });
});
