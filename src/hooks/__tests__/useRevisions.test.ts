import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRevisions } from '@/hooks/useRevisions';

declare global {
    // eslint-disable-next-line no-var
    var fetch: typeof globalThis.fetch;
}

describe('useRevisions', () => {
    const fetchMock = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof global.fetch;
    });

    it('loads revisions when poemId is provided', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ revisions: [{ revisionNumber: 1, summary: 'Summary' }] }),
        });

        const { result } = renderHook(() => useRevisions('poem-1'));

        await waitFor(() => expect(result.current.revisions).toHaveLength(1));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('handles revision load errors', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, statusText: 'Server error' });

        const { result } = renderHook(() => useRevisions('poem-2'));

        await waitFor(() => expect(result.current.error).toContain('Failed to load revisions'));
        expect(result.current.revisions).toEqual([]);

        consoleErrorSpy.mockClear();
    });

    it('loads individual revisions and can clear selection', async () => {
        fetchMock
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ revisions: [] }) })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ revision: { revisionNumber: 2, content: 'Full revision' } }),
            });

        const { result } = renderHook(() => useRevisions('poem-3'));

        await waitFor(() => expect(result.current.revisions).toEqual([]));

        await act(async () => {
            await result.current.loadRevision(2);
        });

        expect(result.current.selectedRevision).toEqual({ revisionNumber: 2, content: 'Full revision' });

        act(() => {
            result.current.clearSelectedRevision();
        });

        expect(result.current.selectedRevision).toBeNull();
    });
});
