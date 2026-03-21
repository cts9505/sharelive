'use client';

import { useState } from 'react';
import { LoginForm } from '../../components/login-form';
import { RegisterForm } from '../../components/register-form';
import Link from 'next/link';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-background/95">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
              SL
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">ShareLive</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Sign in to manage your subdomains'
              : 'Get started with ShareLive for free'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              mode === 'register'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="text-primary hover:opacity-80 font-medium">
              ← Back to home
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:opacity-80">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-primary hover:opacity-80">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
