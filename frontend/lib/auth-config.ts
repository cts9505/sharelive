import NextAuth from 'next-auth';
import type { NextAuthConfig, Session, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8080';

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be set in production');
}

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'sharelive-local-auth-secret-change-me';

interface AuthUser extends User {
  token: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
  };
  token: string;
}

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
          throw new Error(error.error || 'Invalid credentials');
        }

        const data: LoginResponse = await response.json();

        return {
          id: data.user.id,
          email: data.user.email,
          token: data.token,
        } as AuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser;
        token.id = authUser.id;
        token.accessToken = authUser.token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (match backend JWT expiration)
  },
  secret: AUTH_SECRET,
};

const nextAuth = NextAuth(authConfig);

export const { handlers, auth, signIn, signOut } = nextAuth;
