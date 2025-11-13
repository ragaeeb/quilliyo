import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRevision, getRevisionsList } from './revisions';

const supabaseMocks = vi.hoisted(() => {
    const selectMock = vi.fn();
    const eqMock = vi.fn();
    const orderMock = vi.fn();
    const maybeSingleMock = vi.fn();

    const revisionsQuery = {
        eq: eqMock,
        maybeSingle: maybeSingleMock,
        order: orderMock,
        select: selectMock,
    } as any;

    selectMock.mockReturnValue(revisionsQuery);
    eqMock.mockReturnValue(revisionsQuery);
    orderMock.mockResolvedValue({ data: [], error: null });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const fromMock = vi.fn(() => revisionsQuery);
    const supabase = { from: fromMock };
    const createClientMock = vi.fn(async () => supabase);

    return {
        createClientMock,
        eqMock,
        fromMock,
        maybeSingleMock,
        orderMock,
        selectMock,
    };
});

vi.mock('@/lib/supabase/server', () => ({
    createClient: supabaseMocks.createClientMock,
}));

const { createClientMock, eqMock, fromMock, maybeSingleMock, orderMock, selectMock } = supabaseMocks;

beforeEach(() => {
    createClientMock.mockClear();
    fromMock.mockClear();
    selectMock.mockClear();
    eqMock.mockClear();
    orderMock.mockClear();
    maybeSingleMock.mockClear();
});

describe('getRevisionsList', () => {
    it('should retrieve revision list with previews ordered descending', async () => {
        const records = [
            { revision_number: 2, title: 'Latest', content: 'A'.repeat(150), created_at: '2024-01-02' },
            { revision_number: 1, title: 'Initial', content: 'Short', created_at: '2024-01-01' },
        ];
        orderMock.mockResolvedValueOnce({ data: records, error: null });

        const result = await getRevisionsList('user-1', 'notebook-1', 'poem-1');

        expect(createClientMock).toHaveBeenCalled();
        expect(fromMock).toHaveBeenCalledWith('poem_content_revisions');
        expect(selectMock).toHaveBeenCalledWith('revision_number, title, created_at, content');
        expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
        expect(eqMock).toHaveBeenCalledWith('notebook_id', 'notebook-1');
        expect(eqMock).toHaveBeenCalledWith('poem_id', 'poem-1');
        expect(orderMock).toHaveBeenCalledWith('revision_number', { ascending: false });
        expect(result).toEqual([
            {
                created_at: '2024-01-02',
                preview: 'A'.repeat(100),
                revision_number: 2,
                title: 'Latest',
            },
            {
                created_at: '2024-01-01',
                preview: 'Short',
                revision_number: 1,
                title: 'Initial',
            },
        ]);
    });

    it('should throw when Supabase returns an error', async () => {
        const dbError = new Error('database failure');
        orderMock.mockResolvedValueOnce({ data: null, error: dbError });

        await expect(getRevisionsList('user-1', 'notebook-1', 'poem-1')).rejects.toThrow(dbError);
    });
});

describe('getRevision', () => {
    it('should return a single revision when found', async () => {
        const record = { revision_number: 3, content: 'body' };
        maybeSingleMock.mockResolvedValueOnce({ data: record, error: null });

        const result = await getRevision('user-1', 'notebook-1', 'poem-2', 3);

        expect(selectMock).toHaveBeenCalledWith('*');
        expect(eqMock).toHaveBeenCalledWith('revision_number', 3);
        expect(result).toBe(record);
    });

    it('should return null when no revision is found', async () => {
        maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });

        const result = await getRevision('user-1', 'notebook-1', 'poem-2', 10);

        expect(result).toBeNull();
    });

    it('should throw when Supabase returns an error', async () => {
        const dbError = new Error('lookup failed');
        maybeSingleMock.mockResolvedValueOnce({ data: null, error: dbError });

        await expect(getRevision('user-1', 'notebook-1', 'poem-2', 1)).rejects.toThrow(dbError);
    });
});
