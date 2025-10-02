import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    // If there's an error fetching the user, allow the request through
    // to avoid locking users out due to transient failures
    if (error) {
        console.error('Supabase auth error in middleware:', error);
        // Optionally: return NextResponse.next() to allow the request through
        // or implement more sophisticated error handling
    }
    // Protect routes (redirect to login if not authenticated)
    if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login';
        return NextResponse.redirect(url);
    }

    // Redirect to home if already authenticated and trying to access auth pages
    if (user && request.nextUrl.pathname.startsWith('/auth')) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
