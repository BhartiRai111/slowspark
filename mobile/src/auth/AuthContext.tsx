import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadToken, saveToken, setUnauthorizedHandler } from '../api/client';
import { meApi } from '../api/endpoints';
import type { AuthResponse, Me } from '../api/types';
import { firebaseSignOut } from './firebaseAuth';

/**
 * Keeps track of who is logged in.
 * status decides which part of the app is shown:
 *   loading → splash, signedOut → login screens, onboarding → profile setup, ready → main tabs
 */
type Status = 'loading' | 'signedOut' | 'onboarding' | 'ready';

interface AuthState {
  status: Status;
  me: Me | null;
  signIn: (res: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<Me | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [me, setMe] = useState<Me | null>(null);

  const signOut = useCallback(async () => {
    await saveToken(null);
    await firebaseSignOut();
    setMe(null);
    setStatus('signedOut');
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const data = await meApi.get();
      setMe(data);
      setStatus(data.onboardingComplete ? 'ready' : 'onboarding');
      return data;
    } catch {
      return null;
    }
  }, []);

  const signIn = useCallback(async (res: AuthResponse) => {
    await saveToken(res.accessToken);
    await refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    (async () => {
      const token = await loadToken();
      if (!token) {
        setStatus('signedOut');
        return;
      }
      const data = await refreshMe();
      if (!data) setStatus('signedOut');
    })();
  }, [refreshMe, signOut]);

  const value = useMemo(() => ({ status, me, signIn, signOut, refreshMe }), [status, me, signIn, signOut, refreshMe]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
