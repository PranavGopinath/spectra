'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Film, Music, Book, Star, Heart, Bookmark } from 'lucide-react';
import { UserRatingWithItem } from '@/lib/api';

interface RatedItemsVisualizationProps {
  ratings: UserRatingWithItem[];
  onItemClick?: (rating: UserRatingWithItem) => void;
}

const mediaTypeIcons = {
  movie: Film,
  music: Music,
  book: Book,
};

// Define the honeycomb grid layout matching Apple Watch
const gridLayout = [
  // Row 0 (top)
  { row: 0, col: 1, size: 'small' as const },
  { row: 0, col: 2, size: 'small' as const },
  { row: 0, col: 3, size: 'small' as const },
  
  // Row 1
  { row: 1, col: 0, size: 'small' as const },
  { row: 1, col: 1.5, size: 'large' as const },
  { row: 1, col: 2.5, size: 'large' as const },
  { row: 1, col: 4, size: 'small' as const },
  
  // Row 2
  { row: 2, col: 0.5, size: 'large' as const },
  { row: 2, col: 2, size: 'large' as const },
  { row: 2, col: 3.5, size: 'large' as const },
  
  // Row 3
  { row: 3, col: 0, size: 'small' as const },
  { row: 3, col: 1.5, size: 'large' as const },
  { row: 3, col: 2.5, size: 'large' as const },
  { row: 3, col: 4, size: 'small' as const },
  
  // Row 4 (bottom)
  { row: 4, col: 1, size: 'small' as const },
  { row: 4, col: 2, size: 'small' as const },
  { row: 4, col: 3, size: 'small' as const },
];

// Map ratings to grid positions
function mapRatingsToGrid(ratings: UserRatingWithItem[]) {
  return ratings.slice(0, gridLayout.length).map((rating, index) => ({
    ...rating,
    gridPosition: gridLayout[index],
  }));
}

export default function RatedItemsVisualization({ 
  ratings, 
  onItemClick 
}: RatedItemsVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 680 });
  
  const offsetX = useMotionValue<number>(0);
  const offsetY = useMotionValue<number>(0);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const mappedRatings = mapRatingsToGrid(ratings);

  if (ratings.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <p>No rated items to display</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-xl bg-gradient-to-br from-background/50 to-background/30 border border-border">
      <motion.div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.05}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        onDrag={(_, info) => {
          offsetX.set(info.offset.x);
          offsetY.set(info.offset.y);
        }}
        onDragEnd={() => {
          // Snap back to center with spring animation
          animate(offsetX, 0, { type: 'spring', stiffness: 200, damping: 20 });
          animate(offsetY, 0, { type: 'spring', stiffness: 200, damping: 20 });
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: '100%', height: '100%' }}>
            {mappedRatings.map((rating, index) => (
              <RatedItemIcon
                key={rating.id}
                rating={rating}
                offsetX={offsetX}
                offsetY={offsetY}
                containerSize={containerSize}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface RatedItemIconProps {
  rating: UserRatingWithItem & { gridPosition: { row: number; col: number; size: 'small' | 'large' } };
  offsetX: ReturnType<typeof useMotionValue<number>>;
  offsetY: ReturnType<typeof useMotionValue<number>>;
  containerSize: { width: number; height: number };
  onItemClick?: (rating: UserRatingWithItem) => void;
}

function RatedItemIcon({ rating, offsetX, offsetY, containerSize, onItemClick }: RatedItemIconProps) {
  const baseSize = rating.gridPosition.size === 'large' ? 90 : 50;
  const spacing = 100;
  
  // Calculate base position in the grid
  const baseX = rating.gridPosition.col * spacing;
  const baseY = rating.gridPosition.row * spacing;
  
  // Center the grid
  const centerX = containerSize.width / 2;
  const centerY = containerSize.height / 2;
  
  // Calculate offset from center of container
  const iconCenterX = baseX - (2 * spacing);
  const iconCenterY = baseY - (2 * spacing);
  
  // Transform position based on drag offset
  const x = useTransform(
    [offsetX, offsetY],
    ([latestX, latestY]: number[]) => {
      const distance = Math.sqrt(
        Math.pow(iconCenterX - latestX, 2) + 
        Math.pow(iconCenterY - latestY, 2)
      );
      
      const maxDistance = 300;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      
      // Push icons away from drag direction
      const pushX = (iconCenterX - latestX) * normalizedDistance * 0.15;
      
      return centerX + iconCenterX + pushX;
    }
  );
  
  const y = useTransform(
    [offsetX, offsetY],
    ([latestX, latestY]: number[]) => {
      const distance = Math.sqrt(
        Math.pow(iconCenterX - latestX, 2) + 
        Math.pow(iconCenterY - latestY, 2)
      );
      
      const maxDistance = 300;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      
      // Push icons away from drag direction
      const pushY = (iconCenterY - latestY) * normalizedDistance * 0.15;
      
      return centerY + iconCenterY + pushY;
    }
  );
  
  // Scale based on distance from drag point
  const scale = useTransform(
    [offsetX, offsetY],
    ([latestX, latestY]: number[]) => {
      const distance = Math.sqrt(
        Math.pow(iconCenterX - latestX, 2) + 
        Math.pow(iconCenterY - latestY, 2)
      );
      
      const maxDistance = 200;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      
      // Scale down icons closer to drag point
      return 1 - (normalizedDistance * 0.3);
    }
  );

  const IconComponent = mediaTypeIcons[rating.item.media_type as keyof typeof mediaTypeIcons] || Film;

  // Get image URL from metadata based on media type
  const getImageUrl = () => {
    const metadata = rating.item.metadata || {};
    
    if (rating.item.media_type === 'movie') {
      return metadata.poster_url || metadata.image_url || null;
    } else if (rating.item.media_type === 'book') {
      return metadata.thumbnail || metadata.cover_url || metadata.image_url || null;
    } else if (rating.item.media_type === 'music') {
      // For music, try image_url or construct Last.fm image URL
      if (metadata.image_url) return metadata.image_url;
      // Last.fm images are usually in the format: https://lastfm.freetls.fastly.net/i/u/174s/{mbid}.png
      // But we'll use a fallback icon if no image is available
      return null;
    }
    
    return metadata.image_url || metadata.poster_url || metadata.cover_url || metadata.thumbnail || null;
  };

  const imageUrl = getImageUrl();
  const hasImage = imageUrl && imageUrl !== '/placeholder.svg';

  // Get color based on rating
  const getRatingColor = (ratingValue: number) => {
    if (ratingValue >= 4) return 'from-primary/30 to-primary/20';
    if (ratingValue >= 3) return 'from-secondary/30 to-secondary/20';
    return 'from-muted/30 to-muted/20';
  };

  return (
    <motion.div
      className="absolute rounded-2xl flex items-center justify-center pointer-events-auto cursor-pointer group overflow-hidden"
      style={{
        width: baseSize,
        height: baseSize,
        x,
        y,
        scale,
        translateX: '-50%',
        translateY: '-50%',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: rating.gridPosition.row * 0.02 + rating.gridPosition.col * 0.01,
      }}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onItemClick?.(rating)}
    >
      <div className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${getRatingColor(rating.rating)} backdrop-blur-sm border-2 border-primary/30 flex items-center justify-center shadow-lg group-hover:border-primary/60 transition-colors overflow-hidden`}>
        {hasImage ? (
          <>
            <img
              src={imageUrl}
              alt={rating.item.title}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                // Hide image and show icon fallback
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.icon-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }
              }}
            />
            {/* Gradient overlay for better visibility of indicators */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-2xl" />
            {/* Hidden fallback icon for when image fails */}
            <div className="icon-fallback hidden absolute inset-0 items-center justify-center w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20">
              <IconComponent className={`${baseSize > 60 ? 'w-10 h-10' : 'w-6 h-6'} text-primary`} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <IconComponent className={`${baseSize > 60 ? 'w-10 h-10' : 'w-6 h-6'} text-primary`} />
          </div>
        )}
        
        {/* Rating indicator */}
        <div className="absolute -bottom-1 -right-1 bg-background/95 rounded-full p-1 border border-primary/30 shadow-sm">
          <div className="flex items-center gap-0.5">
            <Star className={`${baseSize > 60 ? 'w-3 h-3' : 'w-2 h-2'} text-secondary fill-secondary`} />
            <span className={`${baseSize > 60 ? 'text-xs' : 'text-[10px]'} font-bold text-foreground`}>
              {rating.rating}
            </span>
          </div>
        </div>

        {/* Favorite indicator */}
        {rating.favorite && (
          <div className="absolute -top-1 -right-1">
            <Heart className={`${baseSize > 60 ? 'w-4 h-4' : 'w-3 h-3'} text-destructive fill-destructive`} />
          </div>
        )}

        {/* Watchlist indicator */}
        {rating.want_to_consume && (
          <div className="absolute -top-1 -left-1">
            <Bookmark className={`${baseSize > 60 ? 'w-4 h-4' : 'w-3 h-3'} text-primary fill-primary`} />
          </div>
        )}
      </div>

      {/* Tooltip on hover */}
      <motion.div
        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg pointer-events-none whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <p className="text-xs font-medium text-foreground">{rating.item.title}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {rating.item.media_type} • {rating.rating}/5
        </p>
      </motion.div>
    </motion.div>
  );
}
