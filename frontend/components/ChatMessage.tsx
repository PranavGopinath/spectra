'use client';

import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import TasteRadar from './TasteRadar';
import RecommendationCard from './RecommendationCard';
import { TasteAnalysisResponse, RecommendationItem } from '@/lib/api';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content?: string;
  tasteAnalysis?: TasteAnalysisResponse;
  recommendations?: {
    movie?: RecommendationItem[];
    music?: RecommendationItem[];
    book?: RecommendationItem[];
  };
  dimensionNames?: string[];
  isLoading?: boolean;
  userRatings?: Map<string, {
    rating: number;
    notes?: string;
    favorite?: boolean;
    want_to_consume?: boolean;
  }>;
  onRatingUpdated?: () => void;
}

export default function ChatMessage({
  role,
  content,
  tasteAnalysis,
  recommendations,
  dimensionNames = [],
  isLoading = false,
  userRatings,
  onRatingUpdated,
}: ChatMessageProps) {
  const isUser = role === 'user';

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
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-foreground leading-relaxed">{content}</p>
          </div>
        </div>
      )}
      
      {tasteAnalysis && dimensionNames.length > 0 && (
        <div className="ml-11 space-y-4">
          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">Your Taste Profile</h4>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-4 mb-4">
              <TasteRadar 
                tasteVector={tasteAnalysis.taste_vector} 
                dimensionNames={dimensionNames}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tasteAnalysis.breakdown.map((dim, idx) => {
                const scoreAbs = Math.abs(dim.score);
                const isPositive = dim.score > 0;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-card/40 backdrop-blur-sm rounded-lg border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="font-semibold text-foreground text-sm mb-1">
                      {dim.dimension}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{dim.tendency}</div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isPositive 
                            ? 'bg-gradient-to-r from-primary to-secondary' 
                            : 'bg-gradient-to-r from-accent to-secondary'
                        }`}
                        style={{ width: `${scoreAbs * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                      {dim.score > 0 ? '+' : ''}{dim.score.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {recommendations && (
        <div className="ml-11 space-y-6">
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
                    onRatingUpdated={onRatingUpdated}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
