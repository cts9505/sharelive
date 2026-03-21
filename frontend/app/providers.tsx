'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            className: 'dark:bg-slate-800 dark:text-slate-100 bg-white text-slate-900',
            style: {
              border: '1px solid',
              borderColor: 'var(--toast-border)',
            },
            success: {
              iconTheme: {
                primary: '#22d3ee',
                secondary: '#0f172a',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0f172a',
              },
        },
      }}
      />
      </ThemeProvider>
    </SessionProvider>
  );
}