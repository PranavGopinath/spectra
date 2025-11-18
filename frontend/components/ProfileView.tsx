'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Star, Heart, Bookmark, Film, Music, BookOpen } from 'lucide-react';
import { getUserTasteProfile, getUserRatings, UserResponse } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import TasteRadar from './TasteRadar';

interface ProfileViewProps {
  userId: string;
}

const categoryIcons = {
  movie: Film,
  book: BookOpen,
  music: Music
};

export default function ProfileView({ userId }: ProfileViewProps) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [tasteProfile, setTasteProfile] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [dimensionNames, setDimensionNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load taste profile
      try {
        const profile = await getUserTasteProfile(userId);
        setTasteProfile(profile);
        // Extract dimension names from breakdown
        if (profile.breakdown) {
          setDimensionNames(profile.breakdown.map((d: any) => d.dimension));
        }
      } catch (err) {
        console.warn('Could not load taste profile:', err);
      }

      // Load ratings
      const ratingsData = await getUserRatings(userId);
      setRatings(ratingsData.ratings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalRatings: ratings.length,
    favorites: ratings.filter(r => r.favorite).length,
    watchlist: ratings.filter(r => r.want_to_consume).length,
    movies: ratings.filter(r => r.item.media_type === 'movie').length,
    books: ratings.filter(r => r.item.media_type === 'book').length,
    music: ratings.filter(r => r.item.media_type === 'music').length,
    averageRating: ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : '0.0',
  };

  // Group ratings by type
  const ratingsByType = {
    movie: ratings.filter(r => r.item.media_type === 'movie'),
    book: ratings.filter(r => r.item.media_type === 'book'),
    music: ratings.filter(r => r.item.media_type === 'music'),
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        {user && (
          <p className="text-muted-foreground">
            {user.username || user.email.split('@')[0]}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">{error}</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-secondary" />
                <span className="text-sm text-muted-foreground">Total Ratings</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalRatings}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-destructive" />
                <span className="text-sm text-muted-foreground">Favorites</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.favorites}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Watchlist</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.watchlist}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-secondary fill-secondary" />
                <span className="text-sm text-muted-foreground">Avg Rating</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.averageRating}</p>
            </motion.div>
          </div>

          {/* Taste Profile */}
          {tasteProfile && tasteProfile.taste_vector && dimensionNames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Your Taste Profile</h2>
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 mb-4">
                <TasteRadar 
                  tasteVector={tasteProfile.taste_vector} 
                  dimensionNames={dimensionNames}
                />
              </div>
              {tasteProfile.breakdown && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tasteProfile.breakdown.map((dim: any, idx: number) => {
                    const scoreAbs = Math.abs(dim.score);
                    const isPositive = dim.score > 0;
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-card/40 backdrop-blur-sm rounded-lg border border-border"
                      >
                        <div className="font-semibold text-foreground text-sm mb-1">
                          {dim.dimension}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{dim.tendency}</div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              isPositive 
                                ? 'bg-gradient-to-r from-primary to-secondary' 
                                : 'bg-gradient-to-r from-accent to-secondary'
                            }`}
                            style={{ width: `${scoreAbs * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 text-right">
                          {dim.score > 0 ? '+' : ''}{dim.score.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Ratings by Type */}
          <div className="space-y-6">
            {(['movie', 'book', 'music'] as const).map((type) => {
              const typeRatings = ratingsByType[type];
              if (typeRatings.length === 0) return null;

              const Icon = categoryIcons[type];
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground capitalize">
                      {type}s ({typeRatings.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeRatings.slice(0, 6).map((rating) => (
                      <div
                        key={rating.id}
                        className="p-3 bg-card/40 backdrop-blur-sm rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                            {rating.item.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-secondary fill-secondary" />
                            <span className="text-sm font-semibold text-foreground">
                              {rating.rating}/5
                            </span>
                          </div>
                        </div>
                        {rating.item.year && (
                          <p className="text-xs text-muted-foreground mb-1">{rating.item.year}</p>
                        )}
                        {rating.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {rating.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {rating.favorite && (
                            <Heart className="w-3 h-3 text-destructive fill-destructive" />
                          )}
                          {rating.want_to_consume && (
                            <Bookmark className="w-3 h-3 text-primary fill-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {typeRatings.length > 6 && (
                    <p className="text-sm text-muted-foreground mt-4">
                      +{typeRatings.length - 6} more {type}s
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {stats.totalRatings === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven't rated any items yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Start rating items in the Library or Discover tabs to build your taste profile!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

