import { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    providers: [
        // Added later in auth.ts
    ],
    callbacks: {
        authorized({ auth, request }) {
            const { nextUrl } = request;
            const isLoggedIn = !!auth?.user;
            const origin = nextUrl.origin;
            const isOnDashboard =
                nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/rooms') ||
                nextUrl.pathname.startsWith('/contests') ||
                (nextUrl.pathname.startsWith('/problems') &&
                    nextUrl.pathname !== '/problems');
            if (isOnDashboard && !isLoggedIn) {
                const loginUrl = new URL('/login', origin);
                loginUrl.searchParams.set('callbackUrl', nextUrl.href);
                return NextResponse.redirect(loginUrl);
            }
            if (
                isLoggedIn &&
                (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')
            ) {
                return NextResponse.redirect(new URL('/dashboard', origin));
            }
            return true;
        },
        async signIn({ user, account, profile, email, credentials }) {
            // Add any custom sign in logic here if needed
            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
            }
            return token;
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as any;
                session.user.username = token.username as string;
            }
            return session;
        },
    },
    trustHost: true,
} satisfies NextAuthConfig;
