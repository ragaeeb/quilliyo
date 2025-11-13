import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from './security';

describe('security', () => {
    it('should encrypt and decrypt values symmetrically', () => {
        const plaintext = 'Secret message with unicode 🔐';
        const password = 'super-secure-password';

        const encrypted = encrypt(plaintext, password);
        expect(typeof encrypted).toBe('string');
        expect(encrypted).not.toEqual(plaintext);

        const decrypted = decrypt(encrypted, password);
        expect(decrypted).toEqual(plaintext);
    });

    it('should throw when decrypting with wrong password', () => {
        const encrypted = encrypt('another secret', 'right-password');

        expect(() => decrypt(encrypted, 'wrong-password')).toThrow();
    });
});
