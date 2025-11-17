/**
 * Simple client-side auth state management
 * In production, use proper auth (NextAuth, Auth0, etc.)
 */

const USER_STORAGE_KEY = 'spectra_user';
const TOKEN_STORAGE_KEY = 'spectra_token';

export interface User {
  id: string;
  email: string;
  username?: string;
  created_at?: string;
  oauth_provider?: string;
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null && getAccessToken() !== null;
}

export function logout(): void {
  setCurrentUser(null);
  setAccessToken(null);
}

