'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Check } from 'lucide-react';
import { SignUpFormValues, signUpSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import PasswordStrength from '@/components/ui/PasswordStrength';
import { supabase } from '@/lib/supabase';

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const handleStepOne = () => {
    if (!errors.email && !errors.password && !errors.confirmPassword) {
      setStep(2);
    }
  };

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      router.push('/login?message=Check your email to confirm your account');
    } catch (error: any) {
      setServerError(error.message || 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="glass-card w-full max-w-lg p-8 hover-float relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 text-accent">
            <Crown className="w-8 h-8" />
            <span className="text-2xl font-bold">Tenure</span>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= i
                    ? "bg-accent text-background"
                    : "bg-card border border-border text-muted-foreground"
                }`}
              >
                {step > i ? <Check className="w-5 h-5" /> : i}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-1 mx-1 transition-all duration-300 ${
                    step > i ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Account Info */}
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Create Account</h1>
              <p className="text-muted-foreground">Enter your information</p>
            </div>

            {serverError && (
              <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-r-lg">
                <p className="text-sm text-destructive font-medium">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(handleStepOne)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className="bg-background/50 border-border focus:border-accent transition-colors"
                />
                {errors.email && (
                  <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('password')}
                  className="bg-background/50 border-border focus:border-accent transition-colors"
                />
                {password && <PasswordStrength password={password} />}
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

              <Button type="submit" className="w-full bg-primary hover:glow-blue-lg" size="lg">
                Continue
              </Button>
            </form>
          </>
        )}

        {/* Step 2: Confirmation & Submit */}
        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Confirm Registration</h1>
              <p className="text-muted-foreground">Review and create your account</p>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-background/50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{watch('email')}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">You will receive a confirmation email to verify your account.</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-sm text-center text-muted-foreground">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-accent hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-accent hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  className="w-full bg-accent text-background hover:glow-blue-lg"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
