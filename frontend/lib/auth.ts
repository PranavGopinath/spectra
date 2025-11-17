/**
 * Simple client-side auth state management
 * In production, use proper auth (NextAuth, Auth0, etc.)
 */

const USER_STORAGE_KEY = 'spectra_user';

export interface User {
  id: string;
  email: string;
  username?: string;
  created_at?: string;
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
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

