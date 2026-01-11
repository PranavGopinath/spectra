'use client';

import { useState } from 'react';
import { Film, Music, BookOpen, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import RatingDialog from './RatingDialog';
import { RecommendationItem } from '@/lib/api';

interface RecommendationCardProps {
  item: RecommendationItem;
  onSelect?: (itemId: string) => void;
  onItemClick?: (itemId: string) => void;
  existingRating?: {
    rating?: number;
    notes?: string;
    favorite?: boolean;
    want_to_consume?: boolean;
  };
  onRatingUpdated?: () => void;
  delay?: number;
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

export default function RecommendationCard({ 
  item, 
  onSelect, 
  onItemClick,
  existingRating,
  onRatingUpdated,
  delay = 0
}: RecommendationCardProps) {
  const user = getCurrentUser();
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  
  // Map media_type to category
  const categoryMap: Record<string, 'movie' | 'book' | 'music'> = {
    'movie': 'movie',
    'book': 'book',
    'music': 'music'
  };
  
  const category = categoryMap[item.media_type] || 'movie';
  const Icon = categoryIcons[category];
  
  // Extract subtitle from metadata or description
  const subtitle = item.metadata?.artist || item.metadata?.author || item.metadata?.director || 
                   item.description.split('.')[0] || 'Unknown';
  
  // Get image URL from metadata or use placeholder
  const imageUrl = item.metadata?.image_url || item.metadata?.poster_url || 
                   item.metadata?.cover_url || '/placeholder.svg';
  
  // Calculate rating from similarity (0-1 scale to 0-10 scale)
  const rating = item.similarity ? Math.round(item.similarity * 10 * 10) / 10 : undefined;

  const handleCardClick = () => {
    // Prioritize onItemClick (for ItemDetailModal), then onSelect
    if (onItemClick) {
      onItemClick(item.id);
    } else {
      onSelect?.(item.id);
    }
  };

  return (
    <>
      <Card 
        className="group relative overflow-hidden bg-card/60 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer animate-fade-in-up"
        style={{ animationDelay: `${delay}s` }}
        onClick={handleCardClick}
      >
        <div className="aspect-[2/3] relative overflow-hidden">
          <img 
            src={imageUrl || "/placeholder.svg"} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-90"></div>
          
          <div className="absolute top-2 right-2">
            <div className={`w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center ${categoryColors[category]}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          
          {rating && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm">
              <Star className="w-3 h-3 text-secondary fill-secondary" />
              <span className="text-xs font-semibold text-foreground">{rating}</span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-1 line-clamp-1 text-balance">
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {subtitle}
          </p>
          {item.year && (
            <p className="text-xs text-muted-foreground mt-1">{item.year}</p>
          )}
          
          {/* Rating button */}
          {user && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRatingDialog(true);
              }}
              className="w-full mt-3 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Star className={`w-4 h-4 ${existingRating ? 'text-secondary fill-secondary' : 'text-muted-foreground'}`} />
              <span className="text-muted-foreground">
                {existingRating?.rating 
                  ? `Rated ${existingRating.rating % 1 === 0 ? existingRating.rating.toFixed(0) : existingRating.rating.toFixed(1)}/5` 
                  : 'Rate this'}
              </span>
            </button>
          )}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </Card>

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
    </>
  );
}
