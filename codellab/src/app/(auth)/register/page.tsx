'use client';

import { useActionState } from 'react';
import { register } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
    const [errorMessage, dispatch, isPending] = useActionState(register, undefined);

    return (
        <div className="flex h-screen items-center justify-center bg-zinc-950">
            <Card className="w-[350px] border-zinc-800 bg-zinc-900 text-zinc-100">
                <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>Enter your email below to create your account</CardDescription>
                </CardHeader>
                <form action={dispatch}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" name="username" type="text" placeholder="johndoe" required className="bg-zinc-800 border-zinc-700" />
                        </div>
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
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Button className="w-full" disabled={isPending}>
                            {isPending ? 'Creating account...' : 'Create Account'}
                        </Button>
                        <div className="text-sm text-zinc-400 text-center">
                            Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Log In</Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
