import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

type NotebookRouteModule = typeof import('./route');

const jsonMock = vi.fn((data: unknown, init?: ResponseInit) => ({ data, init }));

vi.mock('next/server', () => ({
    NextResponse: { json: jsonMock },
}));

const withAuthMock = vi.fn((handler: any) => handler);

vi.mock('@/lib/middleware/authMiddleware', () => ({
    withAuth: withAuthMock,
}));

const getNotebookMock = vi.fn();

vi.mock('@/lib/models/notebook', () => ({
    DEFAULT_NOTEBOOK_ID: 'default-notebook',
    getNotebook: getNotebookMock,
}));

const notebookUtilsMocks = {
    deleteRevisionsForDeletedPoems: vi.fn(),
    findChangedPoems: vi.fn(),
    findDeletedPoemIds: vi.fn(),
    insertRevisions: vi.fn(),
    prepareNotebookData: vi.fn(),
    prepareRevisionInserts: vi.fn(),
    upsertNotebookData: vi.fn(),
};

vi.mock('@/lib/notebookSaveUtils', () => notebookUtilsMocks);

const decryptMock = vi.fn();
const encryptMock = vi.fn();

vi.mock('@/lib/security', () => ({
    decrypt: decryptMock,
    encrypt: encryptMock,
}));

let GET: NotebookRouteModule['GET'];
let POST: NotebookRouteModule['POST'];

beforeAll(async () => {
    const module = await import('./route');
    GET = module.GET;
    POST = module.POST;
});

const createRequest = ({
    headers = {},
    json,
    notebookId,
    searchParams = new URLSearchParams(),
}: {
    headers?: Record<string, string>;
    json?: () => Promise<unknown>;
    notebookId?: string;
    searchParams?: URLSearchParams;
}) => {
    const requestHeaders = new Headers(headers);
    const request = {
        headers: requestHeaders,
        json: json ?? (async () => ({})),
        nextUrl: { searchParams },
    } as unknown as NextRequest;

    if (notebookId) {
        searchParams.set('notebookId', notebookId);
    }

    return request;
};

const mockUserContext = { user: { id: 'user-1' }, supabase: {} } as const;

const resetMocks = () => {
    jsonMock.mockClear();
    getNotebookMock.mockReset();
    decryptMock.mockReset();
    encryptMock.mockReset();
    Object.values(notebookUtilsMocks).forEach((mock) => mock.mockReset?.());
};

beforeEach(() => {
    resetMocks();
});

describe('app/api/notebook/route GET', () => {
    it('should return empty poems when no notebook exists', async () => {
        getNotebookMock.mockResolvedValueOnce(null);

        const response = await GET(createRequest({}), mockUserContext);

        expect(jsonMock).toHaveBeenCalledWith({ poems: [] });
        expect(response).toEqual({ data: { poems: [] }, init: undefined });
    });

    it('should request encryption key when notebook is encrypted and no key provided', async () => {
        getNotebookMock.mockResolvedValueOnce({ encrypted: true, poems: [], data: 'ciphertext' });

        await GET(createRequest({}), mockUserContext);

        expect(jsonMock).toHaveBeenCalledWith({ encrypted: true, poems: [] });
    });

    it('should decrypt notebook data when key provided', async () => {
        const decrypted = { poems: [{ id: '1' }] };
        getNotebookMock.mockResolvedValueOnce({ encrypted: true, data: 'ciphertext' });
        decryptMock.mockReturnValueOnce(JSON.stringify(decrypted));

        await GET(
            createRequest({ headers: { 'x-encryption-key': 'secret-key' } }),
            mockUserContext,
        );

        expect(decryptMock).toHaveBeenCalledWith('ciphertext', 'secret-key');
        expect(jsonMock).toHaveBeenCalledWith({ ...decrypted, encrypted: false });
    });

    it('should return 401 when decryption fails', async () => {
        getNotebookMock.mockResolvedValueOnce({ encrypted: true, data: 'ciphertext' });
        decryptMock.mockImplementationOnce(() => {
            throw new Error('bad key');
        });

        await GET(
            createRequest({ headers: { 'x-encryption-key': 'wrong-key' } }),
            mockUserContext,
        );

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid encryption key' }, { status: 401 });
    });

    it('should return poems when notebook is not encrypted', async () => {
        const notebook = { poems: [{ id: 'p1' }] };
        getNotebookMock.mockResolvedValueOnce(notebook);

        await GET(createRequest({}), mockUserContext);

        expect(jsonMock).toHaveBeenCalledWith({ poems: notebook.poems });
    });

    it('should handle unexpected errors and respond with 500', async () => {
        getNotebookMock.mockRejectedValueOnce(new Error('boom'));

        await GET(createRequest({}), mockUserContext);

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch notebook' }, { status: 500 });
    });
});

describe('app/api/notebook/route POST', () => {
    const baseRequestBody = {
        data: { poems: [{ id: 'p1', content: 'text' }] },
        encryptionKey: null,
        notebookId: undefined,
    };

    const createPostRequest = (body: Record<string, unknown>) =>
        createRequest({
            json: async () => body,
        });

    it('should reject when existing notebook is encrypted and no key provided', async () => {
        getNotebookMock.mockResolvedValueOnce({ encrypted: true, data: 'ciphertext' });

        await POST(createPostRequest(baseRequestBody), mockUserContext);

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Encryption key required' }, { status: 401 });
    });

    it('should return 401 when decrypting existing notebook fails', async () => {
        getNotebookMock.mockResolvedValueOnce({ encrypted: true, data: 'ciphertext' });
        decryptMock.mockImplementationOnce(() => {
            throw new Error('decrypt failed');
        });

        await POST(
            createPostRequest({ ...baseRequestBody, encryptionKey: 'secret-key' }),
            mockUserContext,
        );

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid encryption key' }, { status: 401 });
    });

    it('should process notebook save operations', async () => {
        getNotebookMock.mockResolvedValueOnce({ poems: [{ id: 'p1', content: 'prev' }] });
        notebookUtilsMocks.prepareNotebookData.mockReturnValueOnce({ prepared: true });
        notebookUtilsMocks.findDeletedPoemIds.mockReturnValueOnce(['old']);
        notebookUtilsMocks.findChangedPoems.mockReturnValueOnce([{ id: 'p1' }]);
        notebookUtilsMocks.prepareRevisionInserts.mockReturnValueOnce([{ poem_id: 'p1' }]);
        notebookUtilsMocks.deleteRevisionsForDeletedPoems.mockResolvedValueOnce(undefined);
        notebookUtilsMocks.insertRevisions.mockResolvedValueOnce(undefined);
        notebookUtilsMocks.upsertNotebookData.mockResolvedValueOnce(undefined);

        const result = await POST(createPostRequest(baseRequestBody), mockUserContext);

        expect(notebookUtilsMocks.prepareNotebookData).toHaveBeenCalledWith(
            baseRequestBody.data,
            baseRequestBody.encryptionKey,
            encryptMock,
        );
        expect(notebookUtilsMocks.findDeletedPoemIds).toHaveBeenCalledWith([{ id: 'p1', content: 'prev' }], [
            { id: 'p1', content: 'text' },
        ]);
        expect(notebookUtilsMocks.findChangedPoems).toHaveBeenCalled();
        expect(notebookUtilsMocks.prepareRevisionInserts).toHaveBeenCalledWith(
            [{ id: 'p1' }],
            mockUserContext.user.id,
            'default-notebook',
        );
        expect(notebookUtilsMocks.deleteRevisionsForDeletedPoems).toHaveBeenCalledWith(
            mockUserContext.supabase,
            mockUserContext.user.id,
            'default-notebook',
            ['old'],
        );
        expect(notebookUtilsMocks.insertRevisions).toHaveBeenCalled();
        expect(notebookUtilsMocks.upsertNotebookData).toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalled();
        expect(result?.data).toMatchObject({ success: true });
    });

    it('should decrypt existing encrypted notebook before saving', async () => {
        const decryptedNotebook = { poems: [{ id: 'old', content: 'existing' }] };
        getNotebookMock.mockResolvedValueOnce({ encrypted: true, data: 'ciphertext' });
        decryptMock.mockReturnValueOnce(JSON.stringify(decryptedNotebook));
        notebookUtilsMocks.prepareNotebookData.mockReturnValueOnce({ prepared: true });
        notebookUtilsMocks.findDeletedPoemIds.mockReturnValueOnce([]);
        notebookUtilsMocks.findChangedPoems.mockReturnValueOnce([]);
        notebookUtilsMocks.prepareRevisionInserts.mockReturnValueOnce([]);
        notebookUtilsMocks.deleteRevisionsForDeletedPoems.mockResolvedValueOnce(undefined);
        notebookUtilsMocks.insertRevisions.mockResolvedValueOnce(undefined);
        notebookUtilsMocks.upsertNotebookData.mockResolvedValueOnce(undefined);

        await POST(
            createPostRequest({ ...baseRequestBody, encryptionKey: 'secret-key' }),
            mockUserContext,
        );

        expect(decryptMock).toHaveBeenCalledWith('ciphertext', 'secret-key');
        expect(notebookUtilsMocks.findDeletedPoemIds).toHaveBeenCalledWith(
            decryptedNotebook.poems,
            baseRequestBody.data.poems,
        );
    });

    it('should handle errors while saving notebook', async () => {
        getNotebookMock.mockImplementationOnce(() => {
            throw new Error('database offline');
        });

        await POST(createPostRequest(baseRequestBody), mockUserContext);

        expect(jsonMock).toHaveBeenCalledWith(
            { error: 'Error: database offline', success: false },
            { status: 500 },
        );
    });
});
