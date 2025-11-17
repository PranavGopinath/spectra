'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setCurrentUser, setAccessToken } from '@/lib/auth';
import { getUser } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('user_id');
    const errorMessage = searchParams.get('message');

    if (errorMessage) {
      setError(errorMessage);
      setTimeout(() => {
        router.push('/');
      }, 3000);
      return;
    }

    if (token && userId) {
      // Store token
      setAccessToken(token);

      // Fetch user details
      getUser(userId)
        .then((user) => {
          setCurrentUser(user);
          router.push('/');
        })
        .catch((err) => {
          setError(err.message || 'Failed to complete authentication');
          setTimeout(() => {
            router.push('/');
          }, 3000);
        });
    } else {
      setError('Missing authentication parameters');
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-400 text-xl mb-4">Authentication Error</div>
            <div className="text-white/60">{error}</div>
            <div className="text-white/40 text-sm mt-4">Redirecting to home...</div>
          </>
        ) : (
          <>
            <div className="text-white/60 mb-4">Completing authentication...</div>
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
}

