'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { resetPasswordSchema, ResetPasswordFormValues } from '@/lib/validations';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isRecoveryContext, setIsRecoveryContext] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryContext(true);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (form: ResetPasswordFormValues) => {
    setIsLoading(true);
    setServerError(null);
    setServerMessage(null);

    try {
      // Attempt password update using the recovery session
      const { data, error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;

      // Log successful reset for audit purposes
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('auth_audit_log').insert({
            user_id: user.id,
            action: 'password_reset',
            metadata: { method: 'email_link' },
          });
        }
      } catch (logErr) {
        console.error('Audit log insert failed (password_reset):', logErr);
      }

      setServerMessage('Password updated successfully. You can now sign in.');
      reset();
      setTimeout(() => {
        router.replace('/login');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setServerError(err.message || 'Invalid or expired reset link. Request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="glass-card w-full max-w-md p-8 hover-float">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            {isRecoveryContext ? 'Enter and confirm your new password' : 'If you landed here without a valid link, request a new reset.'}
          </p>
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
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('password')}
              className="bg-background/50 border-border focus:border-accent transition-colors"
            />
            {errors.password && (
              <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="bg-background/50 border-border focus:border-accent transition-colors"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary hover:glow-blue-lg" size="lg" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-6">
            <button type="button" onClick={() => router.push('/forgot-password')} className="text-accent hover:underline font-medium">
              Request new reset link
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}