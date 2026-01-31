'use client';

import { useActionState, Suspense } from 'react';
import { authenticate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function LoginFormContent() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    return (
        <Card className="w-[350px] border-zinc-800 bg-zinc-900 text-zinc-100">
            <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <form action={dispatch}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-zinc-800 border-zinc-700" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required className="bg-zinc-800 border-zinc-700" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <div
                            className="flex h-5 items-end space-x-1"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {errorMessage && (
                                <p className="text-sm text-red-500">{errorMessage}</p>
                            )}
                        </div>
                    </div>
                    <input type="hidden" name="callbackUrl" value={callbackUrl} />
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button className="w-full" disabled={isPending}>
                        {isPending ? 'Signing in...' : 'Sign In'}
                    </Button>
                    <div className="text-sm text-zinc-400 text-center">
                        Don't have an account? <Link href="/register" className="text-blue-400 hover:underline">Register</Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-zinc-950">
            <Suspense fallback={<div className="text-zinc-400">Loading...</div>}>
                <LoginFormContent />
            </Suspense>
        </div>
    );
}
