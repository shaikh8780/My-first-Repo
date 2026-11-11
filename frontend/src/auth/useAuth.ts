import { useState, useEffect, useCallback } from 'react';
import {
  signInWithRedirect,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  AuthUser,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

// Test-only: when VITE_E2E_AUTH_BYPASS === 'true' at build time, skip the Cognito
// redirect and present a fixed demo identity so Playwright can drive the app.
// This env var is never set for dev or production builds — only the e2e build.
const E2E_BYPASS = import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(E2E_BYPASS);
  const [isLoading, setIsLoading] = useState(!E2E_BYPASS);
  const [alias, setAlias] = useState<string | null>(E2E_BYPASS ? 'jordanavery' : null);

  const checkAuth = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      const session = await fetchAuthSession();
      const email = (session.tokens?.idToken?.payload?.email as string) ?? null;
      setUser(u);
      setIsAuthenticated(true);
      setAlias(email ? email.split('@')[0].toLowerCase() : null);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      setAlias(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (E2E_BYPASS) return; // fixed demo identity; skip Cognito
    checkAuth();
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'tokenRefresh') checkAuth();
      if (payload.event === 'signedOut') {
        setUser(null);
        setIsAuthenticated(false);
        setAlias(null);
      }
    });
    return unsubscribe;
  }, [checkAuth]);

  const login = useCallback(async () => { await signInWithRedirect(); }, []);
  const logout = useCallback(async () => { await signOut(); }, []);

  return { user, isAuthenticated, isLoading, alias, login, logout };
}
