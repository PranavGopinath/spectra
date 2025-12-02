'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import OnboardingFlow from './OnboardingFlow';
import { 
  getRecommendations, 
  getUserRecommendations,
  generateResponse as generateLLMResponse,
  detectMediaType,
  RecommendationsResponse,
  UserResponse 
} from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { getUserRatings } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content?: string;
  recommendations?: RecommendationsResponse;
}

interface ChatInterfaceProps {
  userId: string;
}

export default function ChatInterface({ userId }: ChatInterfaceProps) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [userRatings, setUserRatings] = useState<Map<string, any>>(new Map());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "What are you looking for today? Whether it's movies, music, or books — share what might resonate with you. 🎬🎵📚",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadUserRatings(currentUser.id);
    }
  }, [userId]);

  const loadUserRatings = async (userId: string) => {
    try {
      const data = await getUserRatings(userId);
      const ratingsMap = new Map();
      data.ratings.forEach(rating => {
        ratingsMap.set(rating.item_id, {
          rating: rating.rating,
          notes: rating.notes,
          favorite: rating.favorite,
          want_to_consume: rating.want_to_consume,
        });
      });
      setUserRatings(ratingsMap);
      // Check if user needs onboarding (no ratings yet)
      if (data.ratings.length === 0) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load user ratings:', error);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGetPersonalizedRecommendations = async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    const userMessage = "Show me personalized recommendations";
    
    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: 'For you' }]);

    try {
      // Generate contextual intro
      let contextualResponse = "Here are some personalized recommendations based on your taste profile:";
      
      // Get user-specific recommendations based on their ratings
      let recommendations: RecommendationsResponse;
      try {
        recommendations = await getUserRecommendations(user.id, { top_k: 5 });
        
        // Ensure recommendations has the expected structure (handle empty object case)
        if (!recommendations || typeof recommendations !== 'object') {
          recommendations = { movie: [], music: [], book: [] };
        } else {
          recommendations = {
            movie: recommendations.movie || [],
            music: recommendations.music || [],
            book: recommendations.book || []
          };
        }
        
        // Check if we got any recommendations
        const hasRecommendations = 
          (recommendations.movie && recommendations.movie.length > 0) ||
          (recommendations.music && recommendations.music.length > 0) ||
          (recommendations.book && recommendations.book.length > 0);
        
        if (!hasRecommendations) {
          contextualResponse = "You don't have enough ratings yet. Rate some items to get personalized recommendations!";
        }
      } catch (error) {
        console.error('Error getting personalized recommendations:', error);
        contextualResponse = "You don't have enough ratings yet. Rate some items to get personalized recommendations!";
        recommendations = { movie: [], music: [], book: [] };
      }
      
      // Add assistant message with recommendations
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: contextualResponse,
          recommendations,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Generate contextual intro for recommendations and detect media type
      let contextualResponse: string;
      let detectedMediaTypes: string[] | null = null;
      try {
        // Generate response without taste analysis (we don't show it in chat)
        const responseData = await generateLLMResponse(userMessage);
        contextualResponse = responseData.response;
        detectedMediaTypes = responseData.detected_media_types || null;
      } catch (error) {
        // Fallback if generation fails - detect media type locally
        console.warn('Response generation failed, using fallback:', error);
        contextualResponse = "Here are some recommendations based on your query:";
        detectedMediaTypes = detectMediaType(userMessage);
      }
      
      // If media type detection failed, try local detection as fallback
      if (!detectedMediaTypes) {
        detectedMediaTypes = detectMediaType(userMessage);
      }
      
      // Get recommendations based on user's query text (not profile-based)
      // This uses 384D embedding similarity search for semantic matching
      // Filter by detected media type if available
      let recommendations: RecommendationsResponse;
      try {
        recommendations = await getRecommendations(userMessage, { 
          top_k: 5,
          media_types: detectedMediaTypes || undefined
        });
        
        // Check if we got any recommendations
        const hasRecommendations = 
          (recommendations.movie && recommendations.movie.length > 0) ||
          (recommendations.music && recommendations.music.length > 0) ||
          (recommendations.book && recommendations.book.length > 0);
        
        if (!hasRecommendations) {
          // If no recommendations found, try user-specific as fallback (if logged in)
          if (user) {
            try {
              recommendations = await getUserRecommendations(user.id, { top_k: 5 });
            } catch {
              // If that also fails, show message
              contextualResponse = "I couldn't find any recommendations matching your query. Try being more specific!";
            }
          } else {
            contextualResponse = "I couldn't find any recommendations matching your query. Try being more specific!";
          }
        }
      } catch (error) {
        console.error('Error getting recommendations:', error);
        // Try user-specific as fallback if logged in
        if (user) {
          try {
            recommendations = await getUserRecommendations(user.id, { top_k: 5 });
          } catch {
            throw error; // Re-throw original error
          }
        } else {
          throw error;
        }
      }
      
      // Add assistant message with recommendations (no taste analysis)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: contextualResponse,
          recommendations,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Show onboarding if needed
  if (showOnboarding && user) {
    return (
      <div className="h-full w-full overflow-y-auto">
        <OnboardingFlow
          userId={user.id}
          onComplete={async () => {
            setShowOnboarding(false);
            await loadUserRatings(user.id);
          }}
          onSkip={() => {
            setShowOnboarding(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full">

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border" data-chat-messages>
        <AnimatePresence>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ChatMessage
                role={message.role}
                content={message.content}
                recommendations={message.recommendations}
                userRatings={userRatings}
                onRatingUpdated={() => user && loadUserRatings(user.id)}
                showLogo={index === 0 && message.role === 'assistant'}
              />
            </div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
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
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative flex items-center gap-2 bg-card/90 backdrop-blur-md border border-border rounded-2xl p-2 shadow-2xl">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What are you in the mood for?"
                className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground py-2 px-3"
                disabled={isLoading}
                rows={1}
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all duration-300 flex-shrink-0 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </form>
        
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Try:</span>
          {user && (
            <button 
              onClick={handleGetPersonalizedRecommendations}
              disabled={isLoading}
              className="px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors disabled:opacity-50"
            >
              For you
            </button>
          )}
          <button 
            onClick={() => setInput('Recommend me sci-fi movies like Interstellar')}
            className="px-2 py-1 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            Sci-fi movies
          </button>
          <button 
            onClick={() => setInput('I need some chill music for studying')}
            className="px-2 py-1 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            Study music
          </button>
        </div>
      </div>
    </div>
  );
}
