import { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    providers: [
        // Added later in auth.ts
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/rooms') ||
                nextUrl.pathname.startsWith('/contests') ||
                (nextUrl.pathname.startsWith('/problems') && nextUrl.pathname !== '/problems'); // Allow viewing list, potentially block details? No, let's allow public access to problems list but maybe not entering?

            // For now, let's protect /dashboard, /rooms (create), /contest (participate)
            // Actually strictly protecting /rooms and /dashboard is good.

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                // Redirect unauthenticated users to login page, preserving the current URL as callback
                const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
                return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
            } else if (isLoggedIn) {
                // Redirect logged-in users away from login/register
                if (nextUrl.pathname === '/login' || nextUrl.pathname === '/register') {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
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
