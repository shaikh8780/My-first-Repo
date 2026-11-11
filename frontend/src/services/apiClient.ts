import { fetchAuthSession } from 'aws-amplify/auth';

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  let token: string | undefined;
  try {
    const session = await fetchAuthSession({ forceRefresh: false });
    token = session.tokens?.idToken?.toString();
  } catch {
    window.location.href = '/';
    throw new Error('Authentication required');
  }

  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
