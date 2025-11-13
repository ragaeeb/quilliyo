import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

type RevisionsRouteModule = typeof import('./route');

const jsonMock = vi.fn((data: unknown, init?: ResponseInit) => ({ data, init }));

vi.mock('next/server', () => ({
    NextResponse: { json: jsonMock },
}));

const withAuthMock = vi.fn((handler: any) => handler);

vi.mock('@/lib/middleware/authMiddleware', () => ({
    withAuth: withAuthMock,
}));

const getRevisionMock = vi.fn();
const getRevisionsListMock = vi.fn();

vi.mock('@/lib/models/revisions', () => ({
    getRevision: getRevisionMock,
    getRevisionsList: getRevisionsListMock,
}));

vi.mock('@/lib/models/notebook', () => ({
    DEFAULT_NOTEBOOK_ID: 'default-notebook',
}));

let GET: RevisionsRouteModule['GET'];

beforeAll(async () => {
    const module = await import('./route');
    GET = module.GET;
});

const createRequest = ({
    params = {},
    searchParams = new URLSearchParams(),
}: {
    params?: Record<string, string>;
    searchParams?: URLSearchParams;
}) => {
    Object.entries(params).forEach(([key, value]) => {
        searchParams.set(key, value);
    });

    return {
        nextUrl: { searchParams },
    } as unknown as NextRequest;
};

const userContext = { user: { id: 'user-123' } } as const;

beforeEach(() => {
    jsonMock.mockClear();
    getRevisionMock.mockReset();
    getRevisionsListMock.mockReset();
});

describe('app/api/revisions/route GET', () => {
    it('should require poemId', async () => {
        await GET(createRequest({}), userContext);

        expect(jsonMock).toHaveBeenCalledWith({ error: 'poemId is required' }, { status: 400 });
    });

    it('should reject invalid revisionNumber values', async () => {
        const request = createRequest({
            params: { notebookId: 'custom', poemId: 'poem-1', revisionNumber: 'abc' },
        });

        await GET(request, userContext);

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid revisionNumber' }, { status: 400 });
    });

    it('should reject revision numbers less than 1', async () => {
        const request = createRequest({
            params: { poemId: 'poem-1', revisionNumber: '0' },
        });

        await GET(request, userContext);

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid revisionNumber' }, { status: 400 });
    });

    it('should return 404 when revision is not found', async () => {
        getRevisionMock.mockResolvedValueOnce(null);
        const request = createRequest({
            params: { poemId: 'poem-1', revisionNumber: '5' },
        });

        await GET(request, userContext);

        expect(getRevisionMock).toHaveBeenCalledWith('user-123', 'default-notebook', 'poem-1', 5);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Revision not found' }, { status: 404 });
    });

    it('should return a specific revision when revisionNumber provided', async () => {
        const revision = { revision_number: 2, content: 'text' };
        getRevisionMock.mockResolvedValueOnce(revision);
        const request = createRequest({
            params: { poemId: 'poem-1', revisionNumber: '2' },
        });

        await GET(request, userContext);

        expect(jsonMock).toHaveBeenCalledWith({ revision });
    });

    it('should list revisions when revisionNumber is missing', async () => {
        const revisions = [{ revision_number: 1 }, { revision_number: 2 }];
        getRevisionsListMock.mockResolvedValueOnce(revisions);
        const request = createRequest({
            params: { poemId: 'poem-1' },
        });

        await GET(request, userContext);

        expect(getRevisionsListMock).toHaveBeenCalledWith('user-123', 'default-notebook', 'poem-1');
        expect(jsonMock).toHaveBeenCalledWith({ revisions });
    });

    it('should return 500 when list retrieval fails', async () => {
        getRevisionsListMock.mockRejectedValueOnce(new Error('fail'));
        const request = createRequest({
            params: { poemId: 'poem-1' },
        });

        await GET(request, userContext);

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch revisions' }, { status: 500 });
    });
});
