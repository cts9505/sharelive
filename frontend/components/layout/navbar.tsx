'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { User, Settings, LogOut, Menu, X } from 'lucide-react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects/new', label: 'New Subdomain' },
  { href: '/docs', label: 'Docs' },
  { href: '/feedback', label: 'Feedback' },
  { href: '/report-bug', label: 'Report Bug' },
] as const;

export const Navbar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  // Close mobile menu and dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showMobileMenu) setShowMobileMenu(false);
      if (showDropdown) setShowDropdown(false);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showMobileMenu, showDropdown]);

  return (
    <header className="relative z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex items-center justify-between px-4 py-3 md:py-4 md:px-8">
        {/* Logo - changes based on theme */}
        <Link href="/" className="flex items-center gap-2">
          <span className={clsx(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-colors",
            mounted && resolvedTheme === 'dark' 
              ? "bg-primary  text-black" 
              : "bg-primary text-primary-foreground"
          )}>
            SL
          </span>
          <span className="hidden sm:block text-sm font-semibold tracking-[0.2em] uppercase text-foreground">
            ShareLive
          </span>
        </Link>

        {/* Mobile: Theme toggle + Profile + Menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle compact />
          
          {session && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <User className="w-5 h-5 text-foreground" />
            </button>
          )}
          
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-5 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'rounded-full px-3 py-1.5 transition-colors',
                pathname === link.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          {session ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-foreground hover:bg-accent transition-colors"
              >
                <User className="w-5 h-5" />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-card-foreground hover:bg-accent transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-card-foreground hover:bg-accent transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="border-t border-border" />
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      signOut();
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-destructive hover:bg-accent transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile dropdown for profile */}
        {showDropdown && session && (
          <div className="absolute top-full right-4 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50 md:hidden">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 text-sm text-card-foreground hover:bg-accent transition-colors"
              onClick={() => setShowDropdown(false)}
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 text-sm text-card-foreground hover:bg-accent transition-colors"
              onClick={() => setShowDropdown(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <div className="border-t border-border" />
            <button
              onClick={() => {
                setShowDropdown(false);
                signOut();
              }}
              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Mobile menu */}
        {showMobileMenu && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-30"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="absolute top-full left-0 right-0 bg-background border-b border-border md:hidden z-40">
              <nav className="flex flex-col px-4 py-3 gap-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={clsx(
                      'px-4 py-3 rounded-xl transition-colors font-medium',
                      pathname === link.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {!session && (
                  <Link
                    href="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="mt-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-center font-medium"
                  >
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
};


