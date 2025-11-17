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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 mb-8"
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="glass backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex gap-2">
              <motion.div
                className="w-3 h-3 bg-purple-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-3 h-3 bg-pink-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-3 h-3 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 mb-8 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50'
            : 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-xl border border-white/10'
        }`}
      >
        {isUser ? (
          <User className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-purple-300" />
        )}
      </motion.div>
      
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        {content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-block rounded-2xl p-5 mb-4 ${
              isUser
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                : 'glass backdrop-blur-xl border border-white/10 text-white'
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          </motion.div>
        )}
        
        {tasteAnalysis && dimensionNames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full" />
              <h4 className="text-xl font-bold text-white">Your Taste Profile</h4>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 mb-4">
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
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="p-4 bg-gradient-to-br from-white/5 to-white/0 rounded-xl border border-white/10 backdrop-blur-sm hover:border-white/20 hover:from-white/10 hover:to-white/5 transition-all cursor-pointer group"
                  >
                    <div className="font-semibold text-white text-sm mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all">
                      {dim.dimension}
                    </div>
                    <div className="text-xs text-white/60 mb-3">{dim.tendency}</div>
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          isPositive 
                            ? 'bg-gradient-to-r from-purple-400 to-pink-400' 
                            : 'bg-gradient-to-r from-blue-400 to-cyan-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${scoreAbs * 100}%` }}
                        transition={{ delay: 0.4 + idx * 0.05, duration: 0.5 }}
                      />
                    </div>
                    <div className="text-xs text-white/40 mt-2 text-right">
                      {dim.score > 0 ? '+' : ''}{dim.score.toFixed(2)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {recommendations && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {recommendations.movie && recommendations.movie.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-red-400 to-orange-400 rounded-full" />
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🎬</span> Movies
                  </h4>
                </div>
                <div className="grid gap-4">
                  {recommendations.movie.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      <RecommendationCard 
                        item={item} 
                        existingRating={userRatings?.get(item.id)}
                        onRatingUpdated={onRatingUpdated}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {recommendations.music && recommendations.music.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-400 rounded-full" />
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🎵</span> Music
                  </h4>
                </div>
                <div className="grid gap-4">
                  {recommendations.music.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      <RecommendationCard 
                        item={item} 
                        existingRating={userRatings?.get(item.id)}
                        onRatingUpdated={onRatingUpdated}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {recommendations.book && recommendations.book.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-yellow-400 rounded-full" />
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">📚</span> Books
                  </h4>
                </div>
                <div className="grid gap-4">
                  {recommendations.book.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      <RecommendationCard 
                        item={item} 
                        existingRating={userRatings?.get(item.id)}
                        onRatingUpdated={onRatingUpdated}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
