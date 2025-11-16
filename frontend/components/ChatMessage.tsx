'use client';

import { ReactNode } from 'react';
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
}

export default function ChatMessage({
  role,
  content,
  tasteAnalysis,
  recommendations,
  dimensionNames = [],
  isLoading = false,
}: ChatMessageProps) {
  const isUser = role === 'user';

  if (isLoading) {
    return (
      <div className="flex gap-3 mb-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
          <span className="text-sm">🤖</span>
        </div>
        <div className="flex-1">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-blue-500' 
          : 'bg-zinc-200 dark:bg-zinc-800'
      }`}>
        <span className="text-sm">{isUser ? '👤' : '🤖'}</span>
      </div>
      
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        {content && (
          <div className={`inline-block rounded-lg p-4 mb-3 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
          }`}>
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        )}
        
        {tasteAnalysis && dimensionNames.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-3">
            <h4 className="font-semibold mb-3 text-zinc-900 dark:text-zinc-100">Your Taste Profile</h4>
            <TasteRadar 
              tasteVector={tasteAnalysis.taste_vector} 
              dimensionNames={dimensionNames}
            />
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {tasteAnalysis.breakdown.map((dim, idx) => (
                <div key={idx} className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{dim.dimension}</div>
                  <div className="text-zinc-600 dark:text-zinc-400">{dim.tendency}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {recommendations && (
          <div className="space-y-3">
            {recommendations.movie && recommendations.movie.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-100">🎬 Movies</h4>
                <div className="grid gap-3">
                  {recommendations.movie.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
            
            {recommendations.music && recommendations.music.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-100">🎵 Music</h4>
                <div className="grid gap-3">
                  {recommendations.music.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
            
            {recommendations.book && recommendations.book.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-100">📚 Books</h4>
                <div className="grid gap-3">
                  {recommendations.book.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

