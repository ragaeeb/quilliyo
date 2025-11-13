import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotebook } from '@/hooks/useNotebook';

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

declare global {
    // eslint-disable-next-line no-var
    var fetch: typeof globalThis.fetch;
}

describe('useNotebook', () => {
    const notebookResponse = { poems: [{ id: '1', title: 'Test', content: 'Body' }], encrypted: false };
    const fetchMock = vi.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof global.fetch;
    });

    it('loads notebook data and updates state', async () => {
        fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(notebookResponse) });

        const { result } = renderHook(() => useNotebook());

        await waitFor(() => expect(result.current.notebook.poems).toHaveLength(1));
        expect(result.current.showEncryptionDialog).toBe(false);
        expect(result.current.isEncrypted).toBe(false);
    });

    it('handles encrypted notebooks without key', async () => {
        fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve({ encrypted: true, poems: [] }) });

        const { result } = renderHook(() => useNotebook());

        await waitFor(() => expect(result.current.showEncryptionDialog).toBe(true));
        expect(result.current.isEncrypted).toBe(true);
        expect(result.current.notebook.poems).toEqual([]);
    });

    it('saves notebook with encryption state updates', async () => {
        fetchMock
            .mockResolvedValueOnce({ json: () => Promise.resolve(notebookResponse) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true, timestamp: '2024-01-01T00:00:00Z', encrypted: true }) });

        const { result } = renderHook(() => useNotebook());
        await waitFor(() => expect(result.current.notebook.poems).toHaveLength(1));

        await act(async () => {
            await result.current.saveNotebook();
        });

        expect(fetchMock).toHaveBeenCalledWith('/api/notebook', expect.objectContaining({ method: 'POST' }));
        expect(result.current.lastSaved).toBe('2024-01-01T00:00:00Z');
        expect(result.current.isEncrypted).toBe(true);
    });

    it('toggles encryption off when key is set', async () => {
        fetchMock
            .mockResolvedValueOnce({ json: () => Promise.resolve(notebookResponse) })
            .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true, timestamp: '2024-02-02T00:00:00Z' }) })
            .mockResolvedValue({ json: () => Promise.resolve({ poems: [], encrypted: false }) });

        const { result } = renderHook(() => useNotebook());
        await waitFor(() => expect(result.current.notebook.poems).toHaveLength(1));

        act(() => {
            result.current.handleEncryptionKeySet('secret');
        });

        expect(result.current.encryptionKey).toBe('secret');

        await act(async () => {
            await result.current.toggleEncryption();
        });

        expect(fetchMock).toHaveBeenLastCalledWith(
            '/api/notebook',
            expect.objectContaining({
                body: JSON.stringify({ data: notebookResponse, encryptionKey: null }),
                method: 'POST',
            }),
        );

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

        const [, , thirdCall] = fetchMock.mock.calls;
        expect(thirdCall?.[1]?.headers).not.toHaveProperty('x-encryption-key');

        await waitFor(() => {
            expect(result.current.isEncrypted).toBe(false);
            expect(result.current.showEncryptionDialog).toBe(false);
        });
    });
});
