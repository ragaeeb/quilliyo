import { Lock, Unlock } from 'lucide-react';
import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EncryptionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSetKey: (key: string) => void;
    isEncrypted: boolean;
}

export const EncryptionDialog = memo(function EncryptionDialog({
    isOpen,
    onClose,
    onSetKey,
    isEncrypted,
}: EncryptionDialogProps) {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key) {
            onSetKey(key);
            setKey('');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEncrypted ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        {isEncrypted ? 'Decrypt Notebook' : 'Encrypt Notebook'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEncrypted
                            ? 'Enter your encryption key to decrypt the notebook.'
                            : 'Set an encryption key to protect your notebook. You will need this key to access your poems.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="encryption-key">Encryption Key</Label>
                        <Input
                            id="encryption-key"
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Enter encryption key"
                            className="mt-1.5"
                            autoFocus
                        />
                        <p className="mt-1 text-muted-foreground text-xs">
                            {isEncrypted
                                ? 'This key will decrypt your notebook.'
                                : 'Keep this key safe. You cannot recover your poems without it.'}
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!key}>
                            {isEncrypted ? 'Decrypt' : 'Encrypt'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
});
