import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EncryptionDialog } from '@/components/EncryptionDialog';

describe('EncryptionDialog', () => {
    it('renders encrypt copy when notebook is not encrypted', () => {
        render(
            <EncryptionDialog isOpen onClose={vi.fn()} onSetKey={vi.fn()} isEncrypted={false} />,
        );

        expect(screen.getByText('Encrypt Notebook')).toBeInTheDocument();
        expect(
            screen.getByText('Keep this key safe. You cannot recover your poems without it.'),
        ).toBeInTheDocument();
    });

    it('renders decrypt copy when notebook is encrypted', () => {
        render(
            <EncryptionDialog isOpen onClose={vi.fn()} onSetKey={vi.fn()} isEncrypted />,
        );

        expect(screen.getByText('Decrypt Notebook')).toBeInTheDocument();
        expect(screen.getByText('This key will decrypt your notebook.')).toBeInTheDocument();
    });

    it('submits the encryption key and clears the field', async () => {
        const user = userEvent.setup();
        const onSetKey = vi.fn();
        const onClose = vi.fn();

        render(
            <EncryptionDialog isOpen onClose={onClose} onSetKey={onSetKey} isEncrypted={false} />,
        );

        const input = screen.getByLabelText('Encryption Key');
        const submitButton = screen.getByRole('button', { name: 'Encrypt' });

        expect(submitButton).toBeDisabled();

        await user.type(input, 'secret');
        expect(submitButton).toBeEnabled();

        await user.click(submitButton);

        expect(onSetKey).toHaveBeenCalledWith('secret');
        expect(onClose).toHaveBeenCalled();
        expect(input).toHaveValue('');
    });
});
