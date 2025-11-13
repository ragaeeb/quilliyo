import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

type AuthMiddlewareModule = typeof import('./authMiddleware');

const jsonMock = vi.fn((data: unknown, init?: ResponseInit) => ({ data, init }));

vi.mock('next/server', () => ({
    NextResponse: { json: jsonMock },
}));

const getUserMock = vi.fn();
const createClientMock = vi.fn(async () => ({
    auth: { getUser: getUserMock },
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}));

let withAuth: AuthMiddlewareModule['withAuth'];
let withAuthUser: AuthMiddlewareModule['withAuthUser'];

beforeAll(async () => {
    const module = await import('./authMiddleware');
    withAuth = module.withAuth;
    withAuthUser = module.withAuthUser;
});

beforeEach(() => {
    jsonMock.mockClear();
    getUserMock.mockReset();
    createClientMock.mockClear();
});

describe('withAuth', () => {
    it('should return unauthorized response when user is missing and log error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        getUserMock.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth failed' } });

        const handler = withAuth(vi.fn());
        const response = await handler({} as NextRequest);

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
        expect(response).toEqual({ data: { error: 'Unauthorized' }, init: { status: 401 } });
        expect(consoleSpy).toHaveBeenCalledWith('Authentication error:', { message: 'Auth failed' });

        consoleSpy.mockRestore();
    });

    it('should return unauthorized response without logging when there is no auth error', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        consoleSpy.mockImplementation(() => {});
        getUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });

        const handler = withAuth(vi.fn());
        await handler({} as NextRequest);

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
        expect(consoleSpy).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('should invoke the wrapped handler when user is present', async () => {
        const handlerSpy = vi.fn(async (_request: NextRequest, context: any) => {
            expect(context.user).toEqual({ id: 'user-1' });
            const supabaseInstance = await createClientMock.mock.results[0]?.value;
            expect(context.supabase).toBe(supabaseInstance);
            return { ok: true } as any;
        });
        getUserMock.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null });

        const handler = withAuth(handlerSpy);
        const response = await handler({} as NextRequest);

        expect(handlerSpy).toHaveBeenCalled();
        expect(response).toEqual({ ok: true });
        expect(createClientMock).toHaveBeenCalledTimes(1);
    });
});

describe('withAuthUser', () => {
    it('should return unauthorized response when user is missing', async () => {
        getUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });

        const handler = withAuthUser(vi.fn());
        await handler({} as NextRequest);

        expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
    });

    it('should pass only the user to wrapped handler', async () => {
        getUserMock.mockResolvedValueOnce({ data: { user: { id: 'abc' } }, error: null });
        const handlerSpy = vi.fn(async (_request: NextRequest, user: any) => {
            expect(user).toEqual({ id: 'abc' });
            return { ok: true } as any;
        });

        const response = await withAuthUser(handlerSpy)({} as NextRequest);

        expect(handlerSpy).toHaveBeenCalled();
        expect(response).toEqual({ ok: true });
    });
});
