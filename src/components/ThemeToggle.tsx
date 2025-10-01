'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <Button variant="outline" size="sm" className="w-[100px]" disabled />;
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="gap-2"
        >
            {theme === 'dark' ? (
                <>
                    <Sun className="h-4 w-4" />
                    Light
                </>
            ) : (
                <>
                    <Moon className="h-4 w-4" />
                    Dark
                </>
            )}
        </Button>
    );
}
