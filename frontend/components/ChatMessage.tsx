'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import ItemDetailModal from './ItemDetailModal';
import { SpectraLogo } from './SpectraLogo';
import { RecommendationItem } from '@/lib/api';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content?: string;
  recommendations?: {
    movie?: RecommendationItem[];
    music?: RecommendationItem[];
    book?: RecommendationItem[];
  };
  isLoading?: boolean;
  userRatings?: Map<string, {
    rating: number;
    notes?: string;
    favorite?: boolean;
    want_to_consume?: boolean;
  }>;
  onRatingUpdated?: () => void;
  showLogo?: boolean;
}

export default function ChatMessage({
  role,
  content,
  recommendations,
  isLoading = false,
  userRatings,
  onRatingUpdated,
  showLogo = false,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-start animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="max-w-2xl bg-card/80 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 shadow-lg">
        <p className="text-foreground">{content}</p>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="max-w-4xl w-full space-y-4">
      {content && (
        <div className="flex items-start gap-3">
          {showLogo ? (
            <div className="flex-shrink-0">
              <SpectraLogo size="sm" animated={false} />
            </div>
          ) : (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-foreground leading-relaxed">{content}</p>
          </div>
        </div>
      )}
      
      {recommendations && (
        <div className="ml-11 space-y-6">
          {(!recommendations.movie || recommendations.movie.length === 0) &&
           (!recommendations.music || recommendations.music.length === 0) &&
           (!recommendations.book || recommendations.book.length === 0) && (
            <div className="text-muted-foreground text-sm italic">
              No recommendations found. Try refining your search!
            </div>
          )}
          
          {recommendations.movie && recommendations.movie.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-xl">🎬</span> Movies
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.movie.map((item, idx) => (
                  <RecommendationCard 
                    key={item.id}
                    item={item} 
                    existingRating={userRatings?.get(item.id)}
                    onItemClick={(itemId) => setSelectedItem(itemId)}
                    onRatingUpdated={onRatingUpdated}
                  />
                ))}
              </div>
            </div>
          )}
          
          {recommendations.music && recommendations.music.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-xl">🎵</span> Music
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.music.map((item, idx) => (
                  <RecommendationCard 
                    key={item.id}
                    item={item} 
                    existingRating={userRatings?.get(item.id)}
                    onItemClick={(itemId) => setSelectedItem(itemId)}
                    onRatingUpdated={onRatingUpdated}
                  />
                ))}
              </div>
            </div>
          )}
          
          {recommendations.book && recommendations.book.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-xl">📚</span> Books
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.book.map((item, idx) => (
                  <RecommendationCard 
                    key={item.id}
                    item={item} 
                    existingRating={userRatings?.get(item.id)}
                    onItemClick={(itemId) => setSelectedItem(itemId)}
                    onRatingUpdated={onRatingUpdated}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          itemId={selectedItem}
          existingRating={userRatings?.get(selectedItem)}
          onRatingUpdated={() => {
            onRatingUpdated?.();
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
