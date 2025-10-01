import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
    DEFAULT_NOTEBOOK_ID,
    deleteNotebook,
    getNotebook,
    getNotebookCollection,
    listNotebooks,
    type NotebookDocument,
    upsertNotebook,
} from './notebook';

const mockCollection = {
    findOne: mock(() => Promise.resolve(null)),
    updateOne: mock(() => Promise.resolve({ acknowledged: true, modifiedCount: 1 })),
    find: mock(() => ({ sort: mock(() => ({ toArray: mock(() => Promise.resolve([])) })) })),
    deleteOne: mock(() => Promise.resolve({ acknowledged: true, deletedCount: 1 })),
};

const mockDb = { collection: mock(() => mockCollection) };

const mockClient = { db: mock(() => mockDb) };

// Mock clientPromise
mock.module('@/lib/mongodb', () => ({ default: Promise.resolve(mockClient) }));

describe('notebook.ts - Database Wrapper', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        mockCollection.findOne.mockClear();
        mockCollection.updateOne.mockClear();
        mockCollection.find.mockClear();
        mockCollection.deleteOne.mockClear();
        mockDb.collection.mockClear();
        mockClient.db.mockClear();
    });

    describe('getNotebookCollection', () => {
        it('should return the notebooks collection', async () => {
            const collection = await getNotebookCollection();

            expect(mockClient.db).toHaveBeenCalledWith('quilliyo');
            expect(mockDb.collection).toHaveBeenCalledWith('notebooks');
            expect(collection).toBe(mockCollection);
        });

        it('should call db and collection with correct parameters', async () => {
            await getNotebookCollection();

            expect(mockClient.db).toHaveBeenCalledTimes(1);
            expect(mockDb.collection).toHaveBeenCalledTimes(1);
        });
    });

    describe('getNotebook', () => {
        const userId = 'user123';
        const customNotebookId = 'custom-notebook';

        it('should fetch notebook with default notebookId', async () => {
            const mockNotebook: NotebookDocument = {
                userId,
                notebookId: DEFAULT_NOTEBOOK_ID,
                poems: [],
                updatedAt: new Date(),
                createdAt: new Date(),
            };
            mockCollection.findOne.mockResolvedValue(mockNotebook);

            const result = await getNotebook(userId);

            expect(mockCollection.findOne).toHaveBeenCalledWith({ userId, notebookId: DEFAULT_NOTEBOOK_ID });
            expect(result).toEqual(mockNotebook);
        });

        it('should fetch notebook with custom notebookId', async () => {
            const mockNotebook: NotebookDocument = {
                userId,
                notebookId: customNotebookId,
                poems: [],
                updatedAt: new Date(),
                createdAt: new Date(),
            };
            mockCollection.findOne.mockResolvedValue(mockNotebook);

            const result = await getNotebook(userId, customNotebookId);

            expect(mockCollection.findOne).toHaveBeenCalledWith({ userId, notebookId: customNotebookId });
            expect(result).toEqual(mockNotebook);
        });

        it('should return null when notebook does not exist', async () => {
            mockCollection.findOne.mockResolvedValue(null);

            const result = await getNotebook(userId);

            expect(result).toBeNull();
        });

        it('should fetch encrypted notebook', async () => {
            const mockNotebook: NotebookDocument = {
                userId,
                notebookId: DEFAULT_NOTEBOOK_ID,
                encrypted: true,
                data: 'encrypted-data-string',
                updatedAt: new Date(),
                createdAt: new Date(),
            };
            mockCollection.findOne.mockResolvedValue(mockNotebook);

            const result = await getNotebook(userId);

            expect(result).toEqual(mockNotebook);
            expect(result?.encrypted).toBe(true);
            expect(result?.data).toBe('encrypted-data-string');
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
                userId,
                notebookId: DEFAULT_NOTEBOOK_ID,
                poems: mockPoems,
                updatedAt: new Date(),
                createdAt: new Date(),
            };
            mockCollection.findOne.mockResolvedValue(mockNotebook);

            const result = await getNotebook(userId);

            expect(result?.poems).toEqual(mockPoems);
            expect(result?.poems?.length).toBe(1);
        });
    });

    describe('upsertNotebook', () => {
        const userId = 'user123';
        const customNotebookId = 'custom-notebook';

        it('should upsert notebook with default notebookId', async () => {
            const data: Partial<NotebookDocument> = {
                poems: [{ id: 'poem1', title: 'Test', content: 'Content', lastUpdatedOn: new Date().toISOString() }],
            };

            await upsertNotebook(userId, data);

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
            const callArgs = mockCollection.updateOne.mock.calls[0];
            expect(callArgs[0]).toEqual({ userId, notebookId: DEFAULT_NOTEBOOK_ID });
            expect(callArgs[1].$set).toMatchObject({ poems: data.poems });
            expect(callArgs[1].$set.updatedAt).toBeInstanceOf(Date);
            expect(callArgs[1].$setOnInsert).toMatchObject({ userId, notebookId: DEFAULT_NOTEBOOK_ID });
            expect(callArgs[1].$setOnInsert.createdAt).toBeInstanceOf(Date);
            expect(callArgs[2]).toEqual({ upsert: true });
        });

        it('should upsert notebook with custom notebookId', async () => {
            const data: Partial<NotebookDocument> = { encrypted: true, data: 'encrypted-data' };

            await upsertNotebook(userId, data, customNotebookId);

            const callArgs = mockCollection.updateOne.mock.calls[0];
            expect(callArgs[0]).toEqual({ userId, notebookId: customNotebookId });
            expect(callArgs[1].$setOnInsert.notebookId).toBe(customNotebookId);
        });

        it('should update updatedAt timestamp', async () => {
            const beforeTime = new Date();
            await upsertNotebook(userId, {});
            const afterTime = new Date();

            const callArgs = mockCollection.updateOne.mock.calls[0];
            const updatedAt = callArgs[1].$set.updatedAt;

            expect(updatedAt).toBeInstanceOf(Date);
            expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(updatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        });

        it('should set createdAt only on insert', async () => {
            await upsertNotebook(userId, {});

            const callArgs = mockCollection.updateOne.mock.calls[0];
            expect(callArgs[1].$setOnInsert.createdAt).toBeInstanceOf(Date);
            expect(callArgs[1].$set.createdAt).toBeUndefined();
        });

        it('should merge partial data correctly', async () => {
            const data: Partial<NotebookDocument> = { encrypted: true, poems: [] };

            await upsertNotebook(userId, data);

            const callArgs = mockCollection.updateOne.mock.calls[0];
            expect(callArgs[1].$set.encrypted).toBe(true);
            expect(callArgs[1].$set.poems).toEqual([]);
        });

        it('should handle empty data object', async () => {
            await upsertNotebook(userId, {});

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
            const callArgs = mockCollection.updateOne.mock.calls[0];
            expect(callArgs[1].$set.updatedAt).toBeInstanceOf(Date);
        });

        it('should preserve all fields in partial data', async () => {
            const data: Partial<NotebookDocument> = {
                encrypted: false,
                data: 'some-data',
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

            const callArgs = mockCollection.updateOne.mock.calls[0];
            expect(callArgs[1].$set).toMatchObject(data);
        });
    });

    describe('listNotebooks', () => {
        const userId = 'user123';

        it('should list all notebooks for a user', async () => {
            const mockNotebooks: NotebookDocument[] = [
                {
                    userId,
                    notebookId: 'notebook1',
                    poems: [],
                    updatedAt: new Date('2024-01-02'),
                    createdAt: new Date('2024-01-02'),
                },
                {
                    userId,
                    notebookId: 'notebook2',
                    poems: [],
                    updatedAt: new Date('2024-01-01'),
                    createdAt: new Date('2024-01-01'),
                },
            ];

            const mockSort = mock(() => ({ toArray: mock(() => Promise.resolve(mockNotebooks)) }));
            mockCollection.find.mockReturnValue({ sort: mockSort });

            const result = await listNotebooks(userId);

            expect(mockCollection.find).toHaveBeenCalledWith({ userId });
            expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(result).toEqual(mockNotebooks);
        });

        it('should return empty array when user has no notebooks', async () => {
            const mockSort = mock(() => ({ toArray: mock(() => Promise.resolve([])) }));
            mockCollection.find.mockReturnValue({ sort: mockSort });

            const result = await listNotebooks(userId);

            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });

        it('should sort notebooks by createdAt descending', async () => {
            const mockSort = mock(() => ({ toArray: mock(() => Promise.resolve([])) }));
            mockCollection.find.mockReturnValue({ sort: mockSort });

            await listNotebooks(userId);

            expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
        });

        it('should handle multiple notebooks with different data', async () => {
            const mockNotebooks: NotebookDocument[] = [
                {
                    userId,
                    notebookId: DEFAULT_NOTEBOOK_ID,
                    poems: [{ id: '1', title: 'Poem', content: 'Content', lastUpdatedOn: '2024-01-01' }],
                    updatedAt: new Date(),
                    createdAt: new Date(),
                },
                {
                    userId,
                    notebookId: 'encrypted-notebook',
                    encrypted: true,
                    data: 'encrypted',
                    updatedAt: new Date(),
                    createdAt: new Date(),
                },
            ];

            const mockSort = mock(() => ({ toArray: mock(() => Promise.resolve(mockNotebooks)) }));
            mockCollection.find.mockReturnValue({ sort: mockSort });

            const result = await listNotebooks(userId);

            expect(result.length).toBe(2);
            expect(result[0].poems).toBeDefined();
            expect(result[1].encrypted).toBe(true);
        });
    });

    describe('deleteNotebook', () => {
        const userId = 'user123';
        const customNotebookId = 'custom-notebook';

        it('should delete a custom notebook', async () => {
            await deleteNotebook(userId, customNotebookId);

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ userId, notebookId: customNotebookId });
        });

        it('should throw error when trying to delete default notebook', async () => {
            await expect(deleteNotebook(userId, DEFAULT_NOTEBOOK_ID)).rejects.toThrow(
                'Cannot delete the default notebook',
            );

            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
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

        it('should successfully delete non-default notebooks', async () => {
            mockCollection.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });

            await deleteNotebook(userId, 'notebook-to-delete');

            expect(mockCollection.deleteOne).toHaveBeenCalledTimes(1);
        });

        it('should handle deletion of non-existent notebook', async () => {
            mockCollection.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 0 });

            await deleteNotebook(userId, 'non-existent');

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ userId, notebookId: 'non-existent' });
        });

        it('should validate notebookId before deletion', async () => {
            const testCases = ['valid-notebook', 'another-notebook-123', 'notebook_with_underscore'];

            for (const notebookId of testCases) {
                await deleteNotebook(userId, notebookId);
                expect(mockCollection.deleteOne).toHaveBeenCalledWith({ userId, notebookId });
            }

            expect(mockCollection.deleteOne).toHaveBeenCalledTimes(testCases.length);
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

        it('should handle database errors in upsertNotebook', async () => {
            mockCollection.updateOne.mockRejectedValue(new Error('Write failed'));

            await expect(upsertNotebook(userId, {})).rejects.toThrow('Write failed');
        });

        it('should handle database errors in listNotebooks', async () => {
            const mockSort = mock(() => ({ toArray: mock(() => Promise.reject(new Error('Query failed'))) }));
            mockCollection.find.mockReturnValue({ sort: mockSort });

            await expect(listNotebooks(userId)).rejects.toThrow('Query failed');
        });

        it('should handle database errors in deleteNotebook', async () => {
            mockCollection.deleteOne.mockRejectedValue(new Error('Delete failed'));

            await expect(deleteNotebook(userId, 'custom')).rejects.toThrow('Delete failed');
        });

        it('should handle special characters in userId', async () => {
            const specialUserId = 'user@example.com';
            await getNotebook(specialUserId);

            expect(mockCollection.findOne).toHaveBeenCalledWith({
                userId: specialUserId,
                notebookId: DEFAULT_NOTEBOOK_ID,
            });
        });

        it('should handle special characters in notebookId', async () => {
            const specialNotebookId = 'notebook-with-special!@#$%^&*()';
            await getNotebook(userId, specialNotebookId);

            expect(mockCollection.findOne).toHaveBeenCalledWith({ userId, notebookId: specialNotebookId });
        });

        it('should handle very long notebookId strings', async () => {
            const longNotebookId = 'a'.repeat(1000);
            await getNotebook(userId, longNotebookId);

            expect(mockCollection.findOne).toHaveBeenCalledWith({ userId, notebookId: longNotebookId });
        });
    });
});
