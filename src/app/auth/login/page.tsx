'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccessMessage('Check your email to confirm your account!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md space-y-8 p-8">
                <div className="text-center">
                    <h1 className="font-bold text-3xl">Quilliyo</h1>
                    <p className="mt-2 text-muted-foreground">
                        {isSignUp ? 'Create your account' : 'Sign in to your account'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>
                    {successMessage && <div className="text-green-600 text-sm">{successMessage}</div>}
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                    </Button>

                    <div className="text-center text-sm">
                        <Button
                            aria-label={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                            className="text-primary hover:underline"
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
