'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Star } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import RatingDialog from './RatingDialog';
import { RecommendationItem } from '@/lib/api';

interface RecommendationCardProps {
  item: RecommendationItem;
  onSelect?: (itemId: string) => void;
  existingRating?: {
    rating: number;
    notes?: string;
    favorite?: boolean;
    want_to_consume?: boolean;
  };
  onRatingUpdated?: () => void;
}

export default function RecommendationCard({ 
  item, 
  onSelect, 
  existingRating,
  onRatingUpdated 
}: RecommendationCardProps) {
  const similarityPercent = Math.round(item.similarity * 100);
  const user = getCurrentUser();
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  
  // Get media type styling
  const mediaTypeStyles: Record<string, { gradient: string; icon: string; color: string }> = {
    movie: {
      gradient: 'from-red-500/20 to-orange-500/20',
      icon: '🎬',
      color: 'text-red-400'
    },
    music: {
      gradient: 'from-green-500/20 to-emerald-500/20',
      icon: '🎵',
      color: 'text-green-400'
    },
    book: {
      gradient: 'from-amber-500/20 to-yellow-500/20',
      icon: '📚',
      color: 'text-amber-400'
    },
  };

  const style = mediaTypeStyles[item.media_type] || {
    gradient: 'from-purple-500/20 to-pink-500/20',
    icon: '📄',
    color: 'text-purple-400'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(item.id)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
      
      {/* Glass card */}
      <div className="relative glass backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="text-3xl flex-shrink-0"
              >
                {style.icon}
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all">
                  {item.title}
                </h3>
                {item.year && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-white/50">
                      {item.year}
                    </p>
                    {similarityPercent > 80 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 text-xs text-purple-400"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Perfect Match</span>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            <p className="text-sm text-white/70 line-clamp-2 mb-4 leading-relaxed">
              {item.description}
            </p>
            
            {/* Similarity bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${similarityPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white min-w-[3rem] text-right">
                  {similarityPercent}%
                </span>
              </div>
            </div>

            {/* Rating button */}
            {user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRatingDialog(true);
                }}
                className="w-full px-4 py-2 rounded-xl border border-white/20 glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-white/80 hover:text-white"
              >
                <Star className={`w-4 h-4 ${existingRating ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                <span className="text-sm font-medium">
                  {existingRating ? `Rated ${existingRating.rating}/5` : 'Rate this'}
                </span>
              </button>
            )}
          </div>
        </div>
        
        {/* Hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-pink-500/10 group-hover:to-purple-500/10 transition-all opacity-0 group-hover:opacity-100 pointer-events-none" />
        
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Rating Dialog */}
      {user && (
        <RatingDialog
          isOpen={showRatingDialog}
          onClose={() => setShowRatingDialog(false)}
          item={item}
          existingRating={existingRating}
          onRatingSaved={() => {
            setShowRatingDialog(false);
            onRatingUpdated?.();
          }}
        />
      )}
    </motion.div>
  );
}
