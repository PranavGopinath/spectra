'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Music, BookOpen, Loader2, Sparkles, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getOnboardingItems, submitInitialPreferences, OnboardingMediaItem, OnboardingRating } from '@/lib/api';
import { BackgroundVisuals } from '@/components/background-visuals';

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
  onSkip?: () => void;
}

const categoryIcons = {
  movie: Film,
  book: BookOpen,
  music: Music
};

const categoryLabels = {
  movie: 'Movies',
  book: 'Books',
  music: 'Music'
};

export default function OnboardingFlow({ userId, onComplete, onSkip }: OnboardingFlowProps) {
  const [items, setItems] = useState<{
    movies: OnboardingMediaItem[];
    books: OnboardingMediaItem[];
    music: OnboardingMediaItem[];
  } | null>(null);
  const [ratings, setRatings] = useState<Map<string, number>>(new Map()); // itemId -> rating (1-5)
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'movie' | 'book' | 'music'>('movie');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOnboardingItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  const setItemRating = (itemId: string, rating: number) => {
    setRatings(prev => {
      const next = new Map(prev);
      if (rating === 0) {
        next.delete(itemId);
      } else {
        next.set(itemId, rating);
      }
      return next;
    });
    // Clear error when user makes a rating
    if (error) {
      setError(null);
    }
  };

  const getRatingForItem = (itemId: string): number => {
    return ratings.get(itemId) || 0;
  };

  const getRatingsByCategory = () => {
    if (!items) return { movie: 0, book: 0, music: 0 };
    
    const movieIds = new Set(items.movies.map(m => m.id));
    const bookIds = new Set(items.books.map(b => b.id));
    const musicIds = new Set(items.music.map(m => m.id));
    
    let movieCount = 0;
    let bookCount = 0;
    let musicCount = 0;
    
    ratings.forEach((rating, itemId) => {
      if (rating > 0) {
        if (movieIds.has(itemId)) movieCount++;
        else if (bookIds.has(itemId)) bookCount++;
        else if (musicIds.has(itemId)) musicCount++;
      }
    });
    
    return { movie: movieCount, book: bookCount, music: musicCount };
  };

  const validateRatings = (): string | null => {
    const counts = getRatingsByCategory();
    
    if (counts.movie === 0) {
      return 'Please rate at least 1 movie';
    }
    if (counts.book === 0) {
      return 'Please rate at least 1 book';
    }
    if (counts.music === 0) {
      return 'Please rate at least 1 artist';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateRatings();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Convert ratings map to array format
    const ratingsArray: OnboardingRating[] = [];
    ratings.forEach((rating, itemId) => {
      if (rating > 0) {
        ratingsArray.push({ item_id: itemId, rating });
      }
    });

    if (ratingsArray.length === 0) {
      setError('Please rate at least one item from each category');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await submitInitialPreferences(userId, ratingsArray);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentItems = () => {
    if (!items) return [];
    switch (activeTab) {
      case 'movie':
        return items.movies;
      case 'book':
        return items.books;
      case 'music':
        return items.music;
    }
  };

  const counts = getRatingsByCategory();
  const totalRated = ratings.size;
  const canSubmit = counts.movie > 0 && counts.book > 0 && counts.music > 0;

  return (
    <div className="relative min-h-screen w-full">
      <BackgroundVisuals />
      <div className="relative z-10 min-h-screen flex items-start justify-center p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl py-8"
        >
          <Card className="bg-card/90 backdrop-blur-md border-border p-8 shadow-2xl">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-16 h-16 text-primary mx-auto" />
              </motion.div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome to Spectra!
              </h1>
              <p className="text-muted-foreground text-lg mb-2">
                Rate movies, books, and music you know to help us understand your taste.
              </p>
              <p className="text-sm text-muted-foreground">
                Please rate at least <span className="font-semibold text-foreground">1 movie</span>,{' '}
                <span className="font-semibold text-foreground">1 book</span>, and{' '}
                <span className="font-semibold text-foreground">1 artist</span> to continue.
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading items...</p>
              </div>
            ) : error && !items ? (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={loadItems} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                {/* Progress Indicators */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  {(['movie', 'book', 'music'] as const).map((tab) => {
                    const Icon = categoryIcons[tab];
                    const count = tab === 'movie' ? counts.movie : tab === 'book' ? counts.book : counts.music;
                    const required = 1;
                    const isComplete = count >= required;
                    return (
                      <div
                        key={tab}
                        className={`p-3 rounded-lg border-2 ${
                          isComplete
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isComplete ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${isComplete ? 'text-primary' : 'text-muted-foreground'}`}>
                            {categoryLabels[tab]}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {count} rated {isComplete && '✓'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-border">
                  {(['movie', 'book', 'music'] as const).map((tab) => {
                    const Icon = categoryIcons[tab];
                    const count = tab === 'movie' ? items!.movies.length :
                                 tab === 'book' ? items!.books.length :
                                 items!.music.length;
                    const ratedCount = tab === 'movie' ? counts.movie :
                                      tab === 'book' ? counts.book :
                                      counts.music;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                          activeTab === tab
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{categoryLabels[tab]}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                        {ratedCount > 0 && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {ratedCount} rated
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Items Grid */}
                <div className="max-h-[500px] overflow-y-auto mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCurrentItems()?.map((item, index) => {
                      const currentRating = getRatingForItem(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            currentRating > 0
                              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                              : 'border-border bg-background/50 hover:border-primary/50 hover:bg-background/70'
                          }`}
                        >
                          <div className="mb-2">
                            <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                              {item.title}
                            </h3>
                            {item.year && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {item.year}
                              </p>
                            )}
                          </div>
                          
                          {/* Rating Stars */}
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemRating(item.id, star);
                                }}
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={(e) => {
                                  // Optional: Add hover effect
                                }}
                              >
                                <Star
                                  className={`w-5 h-5 transition-colors ${
                                    star <= currentRating
                                      ? 'text-secondary fill-secondary'
                                      : 'text-muted-foreground/30 hover:text-secondary/50'
                                  }`}
                                />
                              </button>
                            ))}
                            {currentRating > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {currentRating}/5
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{totalRated}</span> item{totalRated !== 1 ? 's' : ''} rated
                    {!canSubmit && (
                      <span className="ml-2 text-destructive">
                        • Rate at least 1 movie, 1 book, and 1 artist to continue
                      </span>
                    )}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-4 justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canSubmit}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
