import { auth } from './auth-config';

export async function getSession() {
  return await auth();
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession();
  if (!session?.accessToken) {
    return {};
  }
  return {
    Authorization: `Bearer ${session.accessToken}`,
  };
}

