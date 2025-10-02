import type { User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type AuthenticatedContext = { user: User; supabase: Awaited<ReturnType<typeof createClient>> };

type AuthenticatedHandler = (
    request: NextRequest,
    context: AuthenticatedContext,
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that wraps route handlers with authentication
 *
 * @example
 * export const GET = withAuth(async (request, { user, supabase }) => {
 *   // user and supabase are guaranteed to be available here
 *   return NextResponse.json({ userId: user.id });
 * });
 */
export function withAuth(handler: AuthenticatedHandler) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (!user) {
            if (authError) {
                console.error('Authentication error:', authError);
            }
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Call the actual handler with authenticated context
        return handler(request, { supabase, user });
    };
}

/**
 * Variant that provides only the user (for handlers that create their own supabase client)
 */
export function withAuthUser(handler: (request: NextRequest, user: User) => Promise<NextResponse> | NextResponse) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (!user) {
            if (authError) {
                console.error('Authentication error:', authError);
            }
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return handler(request, user);
    };
}
