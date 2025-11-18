'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Film, Music, Book, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ChatMessage from './ChatMessage';
import LoginModal from './LoginModal';
import OnboardingFlow from './OnboardingFlow';
import { BackgroundVisuals } from './background-visuals';
import { 
  analyzeTaste, 
  getRecommendations, 
  getUserRecommendations,
  getDimensions, 
  generateResponse as generateLLMResponse, 
  TasteAnalysisResponse, 
  RecommendationsResponse,
  UserResponse 
} from '@/lib/api';
import { getCurrentUser, setCurrentUser, logout as authLogout } from '@/lib/auth';
import { getUserRatings } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content?: string;
  tasteAnalysis?: TasteAnalysisResponse;
  recommendations?: RecommendationsResponse;
}

export default function ChatInterface() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [userRatings, setUserRatings] = useState<Map<string, any>>(new Map());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "What would you like to discover today? Share what you're into—whether it's movies, music, books, or something else—and let's explore what might resonate with you. 🎬🎵📚",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dimensionNames, setDimensionNames] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check authentication on mount - must happen before any rendering
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const needsOnboarding = await loadUserRatings(currentUser.id);
        if (needsOnboarding) {
          setShowOnboarding(true);
        }
      } else {
        // Show login modal immediately if not authenticated
        setShowLoginModal(true);
      }
      setIsCheckingAuth(false);
    };
    
    // Small delay to ensure component is mounted
    checkAuth();
  }, []);

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
      return data.ratings.length === 0;
    } catch (error) {
      console.error('Failed to load user ratings:', error);
      return false;
    }
  };

  // Load dimension names on mount (only if user is authenticated)
  useEffect(() => {
    if (user) {
      getDimensions()
        .then((dims) => {
          setDimensionNames(dims.map((d) => d.name));
        })
        .catch((error) => {
          console.error('Failed to load dimensions:', error);
          // Don't block the UI if dimensions fail to load
        });
    }
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Analyze taste
      const tasteAnalysis = await analyzeTaste(userMessage);
      
      // Generate contextual intro for recommendations
      let contextualResponse: string;
      try {
        contextualResponse = await generateLLMResponse(userMessage, tasteAnalysis);
      } catch (error) {
        // Fallback if generation fails
        console.warn('Response generation failed, using fallback:', error);
        contextualResponse = "I've analyzed your taste preferences! Here's your taste profile:";
      }
      
      // Add assistant message with taste analysis
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: contextualResponse,
          tasteAnalysis,
        },
      ]);

      // Get recommendations (use user-specific if logged in)
      let recommendations: RecommendationsResponse;
      if (user) {
        try {
          recommendations = await getUserRecommendations(user.id, { top_k: 5 });
        } catch {
          // Fallback to text-based if user has no ratings
          recommendations = await getRecommendations(userMessage, { top_k: 5 });
        }
      } else {
        recommendations = await getRecommendations(userMessage, { top_k: 5 });
      }
      
      // Update last message with recommendations
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.recommendations = recommendations;
        }
        return newMessages;
      });
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
    );
  }

  // Show loading state while checking auth - this blocks rendering until auth check completes
  if (isCheckingAuth) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundVisuals />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated - this should show immediately after auth check
  if (!user && !isCheckingAuth) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundVisuals />
        <div className="relative z-10 flex items-center justify-center h-screen px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl"
          >
            <h1 className="text-6xl font-bold text-foreground mb-4">Spectra</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover movies, music, and books that match your unique taste profile
            </p>
            <p className="text-muted-foreground mb-8">
              Sign in to get started with personalized recommendations
            </p>
          </motion.div>
        </div>

        {/* Login Modal - forced open, cannot be closed */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {}}
          canClose={false}
          onLogin={async (newUser) => {
            setUser(newUser);
            const needsOnboarding = await loadUserRatings(newUser.id);
            setShowLoginModal(false);
            if (needsOnboarding) {
              setShowOnboarding(true);
            }
          }}
          onRegistrationSuccess={async (newUser) => {
            setUser(newUser);
            await loadUserRatings(newUser.id);
            setShowLoginModal(false);
            setShowOnboarding(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundVisuals />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-screen max-w-5xl mx-auto p-4 md:p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 blur-xl bg-primary/30 -z-10"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-balance">Spectra</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-card/50 backdrop-blur-sm border border-border">
              <Film className="w-4 h-4 text-primary" />
              <Music className="w-4 h-4 text-secondary" />
              <Book className="w-4 h-4 text-accent" />
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/profile')}
                  className="px-3 py-1.5 rounded-full bg-card/50 backdrop-blur-sm border border-border hover:bg-card/70 transition-all flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{user.username || user.email.split('@')[0]}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    authLogout();
                    setUser(null);
                    setUserRatings(new Map());
                    setShowLoginModal(true);
                  }}
                  className="p-1.5 rounded-full bg-card/50 backdrop-blur-sm border border-border hover:bg-card/70 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-1.5 rounded-full bg-card/50 backdrop-blur-sm border border-border hover:bg-card/70 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Sign In</span>
              </motion.button>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
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
                  tasteAnalysis={message.tasteAnalysis}
                  recommendations={message.recommendations}
                  dimensionNames={dimensionNames}
                  userRatings={userRatings}
                  onRatingUpdated={() => user && loadUserRatings(user.id)}
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

      {/* Login Modal (for logout/login flow) */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        canClose={true}
        onLogin={(newUser) => {
          setUser(newUser);
          loadUserRatings(newUser.id);
          setShowLoginModal(false);
        }}
      />
    </div>
  );
}
