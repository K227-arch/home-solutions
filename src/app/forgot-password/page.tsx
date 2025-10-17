'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  // Safely read JSON bodies; handle empty (204) or non-JSON responses
  const readJsonSafe = async (res: Response) => {
    const ct = res.headers.get('content-type') || '';
    if (res.status === 204 || !ct.includes('application/json')) return null;
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const onSubmit = async (form: ForgotFormValues) => {
    setIsLoading(true);
    setServerError(null);
    setServerMessage(null);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const payload = await readJsonSafe(res);
      if (!res.ok) {
        let msg = payload?.error as string | undefined;
        if (!msg) {
          try {
            msg = await res.text();
          } catch {}
        }
        throw new Error(msg || 'Failed to request password reset');
      }
      setServerMessage(payload?.message || 'If an account exists, a reset link has been sent.');
      reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="glass-card w-full max-w-md p-8 hover-float">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-muted-foreground">Enter your email to receive a reset link</p>
        </div>

        {serverMessage && (
          <div className="mb-6 p-4 bg-success/10 border-l-4 border-success rounded-r-lg">
            <p className="text-sm text-success font-medium">{serverMessage}</p>
          </div>
        )}

        {serverError && (
          <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-r-lg">
            <p className="text-sm text-destructive font-medium">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
              className="bg-background/50 border-border focus:border-accent transition-colors"
            />
            {errors.email && (
              <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary hover:glow-blue-lg" size="lg" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-6">
            <button type="button" onClick={() => router.push('/login')} className="text-accent hover:underline font-medium">
              Back to Login
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}