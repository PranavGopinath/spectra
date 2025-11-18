'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Film, Music, BookOpen } from 'lucide-react';
import { getItem, OnboardingMediaItem } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import RatingDialog from './RatingDialog';
import { Card } from '@/components/ui/card';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  existingRating?: {
    rating: number;
    notes?: string;
    favorite?: boolean;
    want_to_consume?: boolean;
  };
  onRatingUpdated?: () => void;
}

const categoryIcons = {
  movie: Film,
  book: BookOpen,
  music: Music
};

const categoryColors = {
  movie: 'text-primary',
  book: 'text-accent',
  music: 'text-secondary'
};

export default function ItemDetailModal({
  isOpen,
  onClose,
  itemId,
  existingRating,
  onRatingUpdated,
}: ItemDetailModalProps) {
  const user = getCurrentUser();
  const [item, setItem] = useState<OnboardingMediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  useEffect(() => {
    if (isOpen && itemId) {
      loadItem();
    }
  }, [isOpen, itemId]);

  const loadItem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const itemData = await getItem(itemId);
      setItem(itemData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const category = item?.media_type as 'movie' | 'book' | 'music' || 'movie';
  const Icon = categoryIcons[category] || Film;

  // Extract metadata
  const imageUrl = item?.metadata?.image_url || item?.metadata?.poster_url || 
                   item?.metadata?.cover_url || '/placeholder.svg';
  const subtitle = item?.metadata?.artist || item?.metadata?.author || 
                   item?.metadata?.director || '';
  const genres = item?.metadata?.genres || [];
  const tmdbRating = item?.metadata?.tmdb_rating;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-card/95 backdrop-blur-md border-border p-8 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto shadow-2xl">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-destructive">{error}</div>
                </div>
              ) : item ? (
                <>
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Image */}
                    <div className="relative">
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted">
                        <img 
                          src={imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-4 right-4">
                        <div className={`w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center ${categoryColors[category]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">{item.title}</h2>
                        {subtitle && (
                          <p className="text-lg text-muted-foreground mb-2">{subtitle}</p>
                        )}
                        {item.year && (
                          <p className="text-sm text-muted-foreground">{item.year}</p>
                        )}
                      </div>

                      {/* Genres */}
                      {genres.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {genres.map((genre: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-full bg-muted/50 text-sm text-muted-foreground"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* External Rating */}
                      {tmdbRating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-secondary fill-secondary" />
                          <span className="text-sm text-muted-foreground">
                            TMDB Rating: {tmdbRating.toFixed(1)}/10
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {item.description && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      )}

                      {/* User Rating Section */}
                      {user && (
                        <div className="pt-4 border-t border-border">
                          {existingRating ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-secondary fill-secondary" />
                                <span className="font-semibold text-foreground">
                                  Your Rating: {existingRating.rating}/5
                                </span>
                              </div>
                              {existingRating.notes && (
                                <p className="text-sm text-muted-foreground">
                                  {existingRating.notes}
                                </p>
                              )}
                              <button
                                onClick={() => setShowRatingDialog(true)}
                                className="text-sm text-primary hover:underline"
                              >
                                Edit rating
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowRatingDialog(true)}
                              className="w-full px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all flex items-center justify-center gap-2"
                            >
                              <Star className="w-5 h-5" />
                              Rate this {item.media_type}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </Card>
          </motion.div>

          {/* Rating Dialog */}
          {user && item && (
            <RatingDialog
              isOpen={showRatingDialog}
              onClose={() => setShowRatingDialog(false)}
              item={{
                id: item.id,
                title: item.title,
                media_type: item.media_type,
                year: item.year,
                description: item.description || '',
                metadata: item.metadata || {},
                similarity: 0,
              }}
              existingRating={existingRating}
              onRatingSaved={() => {
                setShowRatingDialog(false);
                onRatingUpdated?.();
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

