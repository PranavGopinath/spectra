'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send } from 'lucide-react';
import { addRating, RatingRequest, RecommendationItem } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Card } from '@/components/ui/card';

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: RecommendationItem;
  existingRating?: {
    rating?: number;
    notes?: string;
    favorite?: boolean;
    want_to_consume?: boolean;
  };
  onRatingSaved?: () => void;
}

export default function RatingDialog({
  isOpen,
  onClose,
  item,
  existingRating,
  onRatingSaved,
}: RatingDialogProps) {
  const user = getCurrentUser();
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [notes, setNotes] = useState(existingRating?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ratingData: RatingRequest = {
        item_id: item.id,
        rating,
        notes: notes || undefined,
        // Preserve existing favorite and My List status if they exist
        favorite: existingRating?.favorite,
        want_to_consume: existingRating?.want_to_consume,
      };

      await addRating(user.id, ratingData);
      onRatingSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rating');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-card/90 backdrop-blur-md border-border p-8 max-w-lg w-full relative max-h-[90vh] overflow-y-auto shadow-2xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-2">{item.title}</h2>
              <p className="text-muted-foreground text-sm mb-6">{item.media_type} {item.year && `• ${item.year}`}</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Stars */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-all ${
                            value <= rating
                              ? 'text-secondary fill-secondary'
                              : 'text-muted-foreground/30 hover:text-secondary/50'
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-muted-foreground text-sm">{rating}/5</span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    placeholder="What did you think?"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-destructive/20 border border-destructive/50 text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading || rating === 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {isLoading ? 'Saving...' : existingRating ? 'Update Rating' : 'Save Rating'}
                </motion.button>
              </form>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
