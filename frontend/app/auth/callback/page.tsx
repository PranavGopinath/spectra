'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { setCurrentUser, setAccessToken } from '@/lib/auth';
import { getUser, getUserRatings } from '@/lib/api';
import { BackgroundVisuals } from '@/components/background-visuals';
import OnboardingFlow from '@/components/OnboardingFlow';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
        .then(async (userData) => {
          setCurrentUser(userData);
          setUser(userData);
          
          // Check if user needs onboarding (no ratings)
          try {
            const ratings = await getUserRatings(userId);
            if (ratings.ratings.length === 0) {
              setShowOnboarding(true);
            } else {
              router.push('/');
            }
          } catch {
            // If we can't check ratings, assume they need onboarding
            setShowOnboarding(true);
          }
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

  // Show onboarding if needed
  if (showOnboarding && user) {
    return (
      <OnboardingFlow
        userId={user.id}
        onComplete={() => {
          router.push('/');
        }}
        onSkip={() => {
          router.push('/');
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundVisuals />
      <div className="relative z-10 flex items-center justify-center h-screen">
        <div className="text-center">
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-destructive text-xl mb-4">Authentication Error</div>
              <div className="text-muted-foreground">{error}</div>
              <div className="text-muted-foreground/60 text-sm mt-4">Redirecting to home...</div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
              <h1 className="text-3xl font-bold text-foreground mb-2">Authenticating...</h1>
              <p className="text-muted-foreground">Please wait while we log you in.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
