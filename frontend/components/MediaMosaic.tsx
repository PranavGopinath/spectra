'use client';

import { useState } from 'react';
import { Film, Music, BookOpen, Star } from 'lucide-react';
import { UserRatingWithItem } from '@/lib/api';

interface MediaMosaicProps {
  items: UserRatingWithItem[];
}

export default function MediaMosaic({ items }: MediaMosaicProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Sort items by rating to determine size
  const sortedItems = [...items].sort((a, b) => b.rating - a.rating);

  // Calculate size based on rating (1-5 scale)
  const getSizeClass = (rating: number, index: number) => {
    if (rating >= 4.5) return 'col-span-2 row-span-2'; // Largest
    if (rating >= 4.0) return index % 3 === 0 ? 'col-span-2 row-span-1' : 'col-span-1 row-span-2'; // Large
    if (rating >= 3.5) return 'col-span-1 row-span-1'; // Medium
    return 'col-span-1 row-span-1'; // Small
  };

  const getCategoryIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'movie': return <Film className="w-3 h-3" />;
      case 'book': return <BookOpen className="w-3 h-3" />;
      case 'music': return <Music className="w-3 h-3" />;
      default: return <Film className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (mediaType: string) => {
    switch (mediaType) {
      case 'movie': return 'from-primary/80 to-primary/40';
      case 'book': return 'from-accent/80 to-accent/40';
      case 'music': return 'from-secondary/80 to-secondary/40';
      default: return 'from-primary/80 to-primary/40';
    }
  };

  // Get image URL from metadata based on media type
  const getImageUrl = (item: UserRatingWithItem) => {
    const metadata = item.item.metadata || {};
    
    if (item.item.media_type === 'movie') {
      return metadata.poster_url || metadata.image_url || '/placeholder.svg';
    } else if (item.item.media_type === 'book') {
      return metadata.thumbnail || metadata.cover_url || metadata.image_url || '/placeholder.svg';
    } else if (item.item.media_type === 'music') {
      return metadata.image_url || '/placeholder.svg';
    }
    
    return metadata.image_url || metadata.poster_url || metadata.cover_url || metadata.thumbnail || '/placeholder.svg';
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No items to display</p>
      </div>
    );
  }

  const averageRating = items.reduce((acc, item) => acc + item.rating, 0) / items.length;

  return (
    <div className="relative w-full">
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Your Collection</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} items rated • Average {averageRating.toFixed(1)} ⭐
          </p>
        </div>
        
        <div className="flex gap-3">
          {['movie', 'book', 'music'].map((cat) => {
            const count = items.filter(item => item.item.media_type === cat).length;
            return (
              <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border">
                {getCategoryIcon(cat)}
                <span className="text-xs font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mosaic Grid */}
      <div className="grid grid-cols-4 auto-rows-[120px] gap-3 md:gap-4">
        {sortedItems.map((item, index) => {
          const isHovered = hoveredItem === item.id;
          const imageUrl = getImageUrl(item);
          
          return (
            <div
              key={item.id}
              className={`
                ${getSizeClass(item.rating, index)}
                relative rounded-xl overflow-hidden cursor-pointer group
                transition-all duration-500 ease-out
                ${isHovered ? 'scale-105 z-20' : 'scale-100 z-10'}
              `}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                animationDelay: `${index * 0.05}s`
              }}
            >
              {/* Image */}
              <div className="absolute inset-0">
                <img
                  src={imageUrl}
                  alt={item.item.title}
                  className={`
                    w-full h-full object-cover
                    transition-all duration-700 ease-out
                    ${isHovered ? 'scale-110 brightness-110' : 'scale-100 brightness-75'}
                  `}
                  onError={(e) => {
                    // Fallback to placeholder if image fails
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>

              {/* Gradient Overlay */}
              <div className={`
                absolute inset-0 bg-gradient-to-t ${getCategoryColor(item.item.media_type)}
                transition-opacity duration-500
                ${isHovered ? 'opacity-80' : 'opacity-40'}
              `} />

              {/* Glowing Border Effect */}
              <div className={`
                absolute inset-0 rounded-xl
                transition-all duration-500
                ${isHovered ? 
                  item.item.media_type === 'movie' ? 'shadow-[0_0_30px_rgba(var(--primary),0.5)] ring-2 ring-primary/50' :
                  item.item.media_type === 'book' ? 'shadow-[0_0_30px_rgba(var(--accent),0.5)] ring-2 ring-accent/50' :
                  'shadow-[0_0_30px_rgba(var(--secondary),0.5)] ring-2 ring-secondary/50'
                  : ''
                }
              `} />

              {/* Content Overlay */}
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                {/* Top: Category & Rating */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`
                    flex items-center gap-1 px-2 py-1 rounded-full 
                    bg-background/80 backdrop-blur-sm text-foreground
                    transition-all duration-300
                    ${isHovered ? 'scale-110' : 'scale-100'}
                  `}>
                    {getCategoryIcon(item.item.media_type)}
                  </div>
                  
                  <div className={`
                    flex items-center gap-1 px-2 py-1 rounded-full
                    bg-background/80 backdrop-blur-sm
                    transition-all duration-300
                    ${isHovered ? 'scale-110' : 'scale-100'}
                  `}>
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span className="text-xs font-bold text-foreground">{item.rating}</span>
                  </div>
                </div>

                {/* Bottom: Title (appears on hover) */}
                <div className={`
                  transition-all duration-500 ease-out
                  ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}>
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 text-balance leading-tight mb-1">
                    {item.item.title}
                  </h3>
                  {item.item.year && (
                    <p className="text-xs text-muted-foreground">{item.item.year}</p>
                  )}
                </div>
              </div>

              {/* Shimmer Effect on Hover */}
              <div className={`
                absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                transition-opacity duration-300
                ${isHovered ? 'opacity-100 animate-shimmer' : 'opacity-0'}
              `} />
            </div>
          );
        })}
      </div>

      {/* Bottom Fade Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}

