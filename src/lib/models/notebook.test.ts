import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
    DEFAULT_NOTEBOOK_ID,
    deleteNotebook,
    getNotebook,
    listNotebooks,
    type NotebookDocument,
    upsertNotebook,
} from './notebook';

const mockSelect = mock(() => mockQuery);
const mockEq = mock(() => mockQuery);
const mockSingle = mock(() => Promise.resolve({ data: null, error: null }));
const mockUpsert = mock(() => Promise.resolve({ error: null }));
const mockOrder = mock(() => Promise.resolve({ data: [], error: null }));
const mockDelete = mock(() => mockDeleteQuery);

const mockQuery = { select: mockSelect, eq: mockEq, single: mockSingle, order: mockOrder };

const mockDeleteQuery = { eq: mockEq };

const mockFrom = mock(() => ({ select: mockSelect, upsert: mockUpsert, delete: mockDelete }));

const mockSupabase = { from: mockFrom };

const mockCreateClient = mock(() => Promise.resolve(mockSupabase));

mock.module('@/lib/supabase/server', () => ({ createClient: mockCreateClient }));

describe('notebook.ts - Supabase Wrapper', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        mockCreateClient.mockClear();
        mockFrom.mockClear();
        mockSelect.mockClear();
        mockEq.mockClear();
        mockSingle.mockClear();
        mockUpsert.mockClear();
        mockOrder.mockClear();
        mockDelete.mockClear();

        // Reset mock implementations
        mockSelect.mockReturnValue(mockQuery);
        mockEq.mockReturnValue(mockQuery);
        mockSingle.mockResolvedValue({ data: null, error: null });
        mockUpsert.mockResolvedValue({ error: null });
        mockOrder.mockResolvedValue({ data: [], error: null });
        mockDelete.mockReturnValue(mockDeleteQuery);
    });

    describe('getNotebook', () => {
        const userId = 'user123';
        const customNotebookId = 'custom-notebook';

        it('should fetch notebook with default notebookId', async () => {
            const mockNotebook: NotebookDocument = {
                id: 'doc1',
                user_id: userId,
                notebook_id: DEFAULT_NOTEBOOK_ID,
                poems: [],
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };
            mockSingle.mockResolvedValue({ data: mockNotebook, error: null });

            const result = await getNotebook(userId);

            expect(mockFrom).toHaveBeenCalledWith('notebooks');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('user_id', userId);
            expect(mockEq).toHaveBeenCalledWith('notebook_id', DEFAULT_NOTEBOOK_ID);
            expect(mockSingle).toHaveBeenCalled();
            expect(result).toEqual(mockNotebook);
        });

        it('should fetch notebook with custom notebookId', async () => {
            const mockNotebook: NotebookDocument = {
                id: 'doc2',
                user_id: userId,
                notebook_id: customNotebookId,
                poems: [],
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };
            mockSingle.mockResolvedValue({ data: mockNotebook, error: null });

            const result = await getNotebook(userId, customNotebookId);

            expect(mockEq).toHaveBeenCalledWith('user_id', userId);
            expect(mockEq).toHaveBeenCalledWith('notebook_id', customNotebookId);
            expect(result).toEqual(mockNotebook);
        });

        it('should return null when notebook does not exist (PGRST116 error)', async () => {
            mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows returned' } });

            const result = await getNotebook(userId);

            expect(result).toBeNull();
        });

        it('should throw error for non-PGRST116 errors', async () => {
            const dbError = { code: 'PGRST500', message: 'Database error' };
            mockSingle.mockResolvedValue({ data: null, error: dbError });

            await expect(getNotebook(userId)).rejects.toEqual(dbError);
        });

        it('should fetch encrypted notebook', async () => {
            const mockNotebook: NotebookDocument = {
                id: 'doc3',
                user_id: userId,
                notebook_id: DEFAULT_NOTEBOOK_ID,
                encrypted: true,
                data: 'encrypted-data-string',
                poems: null,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };
            mockSingle.mockResolvedValue({ data: mockNotebook, error: null });

            const result = await getNotebook(userId);

            expect(result).toEqual(mockNotebook);
            expect(result?.encrypted).toBe(true);
            expect(result?.data).toBe('encrypted-data-string');
            expect(result?.poems).toBeNull();
        });

        it('should fetch notebook with poems', async () => {
            const mockPoems = [
                {
                    id: 'poem1',
                    title: 'Test Poem',
                    content: 'Poem content',
                    lastUpdatedOn: new Date().toISOString(),
                    tags: ['tag1', 'tag2'],
                    category: 'nature',
                    chapter: 'Chapter 1',
                },
            ];
            const mockNotebook: NotebookDocument = {
                id: 'doc4',
                user_id: userId,
                notebook_id: DEFAULT_NOTEBOOK_ID,
                poems: mockPoems,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };
            mockSingle.mockResolvedValue({ data: mockNotebook, error: null });

            const result = await getNotebook(userId);

            expect(result?.poems).toEqual(mockPoems);
            expect(result?.poems?.length).toBe(1);
        });
    });

    describe('upsertNotebook', () => {
        const userId = 'user123';
        const customNotebookId = 'custom-notebook';

        it('should upsert notebook with default notebookId', async () => {
            const data = {
                poems: [{ id: 'poem1', title: 'Test', content: 'Content', lastUpdatedOn: new Date().toISOString() }],
            };

            await upsertNotebook(userId, data);

            expect(mockFrom).toHaveBeenCalledWith('notebooks');
            expect(mockUpsert).toHaveBeenCalledWith(
                { user_id: userId, notebook_id: DEFAULT_NOTEBOOK_ID, ...data },
                { onConflict: 'user_id,notebook_id' },
            );
        });

        it('should upsert notebook with custom notebookId', async () => {
            const data = { encrypted: true, data: 'encrypted-data' };

            await upsertNotebook(userId, data, customNotebookId);

            expect(mockUpsert).toHaveBeenCalledWith(
                { user_id: userId, notebook_id: customNotebookId, ...data },
                { onConflict: 'user_id,notebook_id' },
            );
        });

        it('should handle encrypted data', async () => {
            const data = { encrypted: true, data: 'encrypted-string', poems: null };

            await upsertNotebook(userId, data);

            expect(mockUpsert).toHaveBeenCalledWith(
                { user_id: userId, notebook_id: DEFAULT_NOTEBOOK_ID, ...data },
                { onConflict: 'user_id,notebook_id' },
            );
        });

        it('should handle unencrypted data', async () => {
            const data = { encrypted: false, poems: [], data: null };

            await upsertNotebook(userId, data);

            expect(mockUpsert).toHaveBeenCalledWith(
                { user_id: userId, notebook_id: DEFAULT_NOTEBOOK_ID, ...data },
                { onConflict: 'user_id,notebook_id' },
            );
        });

        it('should throw error on upsert failure', async () => {
            const dbError = { message: 'Upsert failed', code: 'PGRST500' };
            mockUpsert.mockResolvedValue({ error: dbError });

            await expect(upsertNotebook(userId, {})).rejects.toEqual(dbError);
        });

        it('should handle empty data object', async () => {
            await upsertNotebook(userId, {});

            expect(mockUpsert).toHaveBeenCalledWith(
                { user_id: userId, notebook_id: DEFAULT_NOTEBOOK_ID },
                { onConflict: 'user_id,notebook_id' },
            );
        });

        it('should preserve all fields in partial data', async () => {
            const data = {
                encrypted: false,
                data: null,
                poems: [
                    {
                        id: 'p1',
                        title: 'Title',
                        content: 'Content',
                        lastUpdatedOn: '2024-01-01',
                        tags: ['tag1'],
                        category: 'cat1',
                        chapter: 'ch1',
                    },
                ],
            };

            await upsertNotebook(userId, data);

            expect(mockUpsert).toHaveBeenCalledWith(
                { user_id: userId, notebook_id: DEFAULT_NOTEBOOK_ID, ...data },
                { onConflict: 'user_id,notebook_id' },
            );
        });
    });

    describe('listNotebooks', () => {
        const userId = 'user123';

        it('should list all notebooks for a user', async () => {
            const mockNotebooks: NotebookDocument[] = [
                {
                    id: 'doc1',
                    user_id: userId,
                    notebook_id: 'notebook1',
                    poems: [],
                    updated_at: new Date('2024-01-02').toISOString(),
                    created_at: new Date('2024-01-02').toISOString(),
                },
                {
                    id: 'doc2',
                    user_id: userId,
                    notebook_id: 'notebook2',
                    poems: [],
                    updated_at: new Date('2024-01-01').toISOString(),
                    created_at: new Date('2024-01-01').toISOString(),
                },
            ];
            mockOrder.mockResolvedValue({ data: mockNotebooks, error: null });

            const result = await listNotebooks(userId);

            expect(mockFrom).toHaveBeenCalledWith('notebooks');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('user_id', userId);
            expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
            expect(result).toEqual(mockNotebooks);
        });

        it('should return empty array when user has no notebooks', async () => {
            mockOrder.mockResolvedValue({ data: [], error: null });

            const result = await listNotebooks(userId);

            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });

        it('should return empty array when data is null', async () => {
            mockOrder.mockResolvedValue({ data: null, error: null });

            const result = await listNotebooks(userId);

            expect(result).toEqual([]);
        });

        it('should throw error on query failure', async () => {
            const dbError = { message: 'Query failed', code: 'PGRST500' };
            mockOrder.mockResolvedValue({ data: null, error: dbError });

            await expect(listNotebooks(userId)).rejects.toEqual(dbError);
        });

        it('should handle multiple notebooks with different data', async () => {
            const mockNotebooks: NotebookDocument[] = [
                {
                    id: 'doc1',
                    user_id: userId,
                    notebook_id: DEFAULT_NOTEBOOK_ID,
                    poems: [{ id: '1', title: 'Poem', content: 'Content', lastUpdatedOn: '2024-01-01' }],
                    updated_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                },
                {
                    id: 'doc2',
                    user_id: userId,
                    notebook_id: 'encrypted-notebook',
                    encrypted: true,
                    data: 'encrypted',
                    poems: null,
                    updated_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                },
            ];
            mockOrder.mockResolvedValue({ data: mockNotebooks, error: null });

            const result = await listNotebooks(userId);

            expect(result.length).toBe(2);
            expect(result[0].poems).toBeDefined();
            expect(result[1].encrypted).toBe(true);
        });
    });

    describe('deleteNotebook', () => {
        const userId = 'user123';

        it('should throw error when trying to delete default notebook', async () => {
            await expect(deleteNotebook(userId, DEFAULT_NOTEBOOK_ID)).rejects.toThrow(
                'Cannot delete the default notebook',
            );

            expect(mockDelete).not.toHaveBeenCalled();
        });

        it('should throw error with correct message for default notebook', async () => {
            try {
                await deleteNotebook(userId, DEFAULT_NOTEBOOK_ID);
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Cannot delete the default notebook');
            }
        });
    });

    describe('DEFAULT_NOTEBOOK_ID', () => {
        it('should export DEFAULT_NOTEBOOK_ID constant', () => {
            expect(DEFAULT_NOTEBOOK_ID).toBe('default');
        });

        it('should be a string', () => {
            expect(typeof DEFAULT_NOTEBOOK_ID).toBe('string');
        });
    });

    describe('Error handling and edge cases', () => {
        const userId = 'user123';

        it('should handle special characters in userId', async () => {
            const specialUserId = 'user@example.com';
            mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

            await getNotebook(specialUserId);

            expect(mockEq).toHaveBeenCalledWith('user_id', specialUserId);
        });

        it('should handle special characters in notebookId', async () => {
            const specialNotebookId = 'notebook-with-special!@#$%^&*()';
            mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

            await getNotebook(userId, specialNotebookId);

            expect(mockEq).toHaveBeenCalledWith('notebook_id', specialNotebookId);
        });

        it('should handle very long notebookId strings', async () => {
            const longNotebookId = 'a'.repeat(1000);
            mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

            await getNotebook(userId, longNotebookId);

            expect(mockEq).toHaveBeenCalledWith('notebook_id', longNotebookId);
        });
    });
});
