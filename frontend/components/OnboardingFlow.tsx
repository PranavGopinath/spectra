'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Music, BookOpen, Check, Loader2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getOnboardingItems, submitInitialPreferences, OnboardingMediaItem } from '@/lib/api';
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
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

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one item you like');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await submitInitialPreferences(userId, Array.from(selectedItems));
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundVisuals />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
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
              <p className="text-muted-foreground text-lg">
                Help us understand your taste by selecting some movies, books, and music you enjoy.
                This helps us provide better recommendations.
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
                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-border">
                  {(['movie', 'book', 'music'] as const).map((tab) => {
                    const Icon = categoryIcons[tab];
                    const count = tab === 'movie' ? items!.movies.length :
                                 tab === 'book' ? items!.books.length :
                                 items!.music.length;
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
                      </button>
                    );
                  })}
                </div>

                {/* Items Grid */}
                <div className="max-h-[500px] overflow-y-auto mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCurrentItems()?.map((item, index) => {
                      const isSelected = selectedItems.has(item.id);
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => toggleItem(item.id)}
                          className={`text-left p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                              : 'border-border bg-background/50 hover:border-primary/50 hover:bg-background/70'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                              {item.title}
                            </h3>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex-shrink-0 ml-2"
                              >
                                <Check className="w-5 h-5 text-primary" />
                              </motion.div>
                            )}
                          </div>
                          {item.year && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {item.year}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Selection Summary */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{selectedItems.size}</span> item{selectedItems.size !== 1 ? 's' : ''} selected
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
                    onClick={handleSkip}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedItems.size === 0}
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

