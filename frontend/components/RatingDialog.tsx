'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Heart, Bookmark, Send } from 'lucide-react';
import { addRating, RatingRequest, RecommendationItem } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: RecommendationItem;
  existingRating?: {
    rating: number;
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
  const [favorite, setFavorite] = useState(existingRating?.favorite || false);
  const [wantToConsume, setWantToConsume] = useState(existingRating?.want_to_consume || false);
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
        favorite: favorite || undefined,
        want_to_consume: wantToConsume || undefined,
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold gradient-text mb-2">{item.title}</h2>
              <p className="text-white/60 text-sm mb-6">{item.media_type} {item.year && `• ${item.year}`}</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating Stars */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
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
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-white/20 hover:text-yellow-400/50'
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-white/60 text-sm">{rating}/5</span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 glass backdrop-blur-xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                    placeholder="What did you think?"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                {/* Options */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFavorite(!favorite)}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      favorite
                        ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        : 'border-white/20 text-white/60 hover:border-white/40'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${favorite ? 'fill-red-400' : ''}`} />
                    Favorite
                  </button>
                  <button
                    type="button"
                    onClick={() => setWantToConsume(!wantToConsume)}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      wantToConsume
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : 'border-white/20 text-white/60 hover:border-white/40'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${wantToConsume ? 'fill-blue-400' : ''}`} />
                    Watchlist
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading || rating === 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {isLoading ? 'Saving...' : existingRating ? 'Update Rating' : 'Save Rating'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

