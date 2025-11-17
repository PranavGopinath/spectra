'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import UserProfile from '@/components/UserProfile';
import { BackgroundVisuals } from '@/components/background-visuals';
import { getCurrentUser, User } from '@/lib/auth';
import { getDimensions, UserResponse } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [dimensionNames, setDimensionNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    // Fetch full user details
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });

    // Load dimension names
    getDimensions().then((dims) => {
      setDimensionNames(dims.map((d) => d.name));
    });
  }, [router]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundVisuals />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundVisuals />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/')}
          className="mb-6 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:bg-card/70 transition-all flex items-center gap-2 text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <UserProfile 
            user={user} 
            dimensionNames={dimensionNames}
            onRatingDeleted={() => {
              // Refresh page data if needed
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
