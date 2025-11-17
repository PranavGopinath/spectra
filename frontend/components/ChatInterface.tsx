'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Film, Music, Book, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ChatMessage from './ChatMessage';
import LoginModal from './LoginModal';
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Spectra, your taste discovery assistant. Tell me about your preferences in movies, music, or books, and I'll help you discover new favorites across all media types! 🎬🎵📚",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dimensionNames, setDimensionNames] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check authentication on mount - must happen before any rendering
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        loadUserRatings(currentUser.id);
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
    } catch (error) {
      console.error('Failed to load user ratings:', error);
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

  // Show loading state while checking auth - this blocks rendering until auth check completes
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // Show login prompt if not authenticated - this should show immediately after auth check
  if (!user && !isCheckingAuth) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Welcome screen */}
        <div className="relative z-10 flex items-center justify-center h-full px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl"
          >
            <h1 className="text-6xl font-bold gradient-text mb-4">Spectra</h1>
            <p className="text-xl text-white/80 mb-8">
              Discover movies, music, and books that match your unique taste profile
            </p>
            <p className="text-white/60 mb-8">
              Sign in to get started with personalized recommendations
            </p>
          </motion.div>
        </div>

        {/* Login Modal - forced open, cannot be closed */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {}}
          canClose={false}
          onLogin={(newUser) => {
            setUser(newUser);
            loadUserRatings(newUser.id);
            setShowLoginModal(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 border-b border-white/10 glass backdrop-blur-xl px-6 py-6"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Spectra</h1>
            <p className="text-sm text-white/60 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Cross-domain taste discovery
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-white/40">
              <Film className="w-5 h-5" />
              <Music className="w-5 h-5" />
              <Book className="w-5 h-5" />
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/profile')}
                  className="px-4 py-2 rounded-xl border border-white/20 glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2 text-white"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.username || user.email.split('@')[0]}</span>
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
                  className="p-2 rounded-xl border border-white/20 glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all text-white/60 hover:text-white"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 rounded-xl border border-white/20 glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2 text-white"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Sign In</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
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
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <ChatMessage role="assistant" isLoading={true} />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 border-t border-white/10 glass backdrop-blur-xl px-6 py-6"
      >
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your taste... What moves you? What resonates?"
                className="w-full resize-none rounded-2xl border border-white/20 glass backdrop-blur-xl px-6 py-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
                rows={3}
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-4 text-xs text-white/30">
                {input.length > 0 && `${input.length} chars`}
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={!input.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/50 flex items-center gap-2 hover:shadow-purple-500/70"
            >
              <Send className="w-5 h-5" />
              {isLoading ? 'Analyzing...' : 'Send'}
            </motion.button>
          </div>
          <p className="mt-3 text-xs text-white/40 text-center">
            Press <kbd className="px-2 py-1 bg-white/10 rounded">Enter</kbd> to send, <kbd className="px-2 py-1 bg-white/10 rounded">Shift+Enter</kbd> for new line
          </p>
        </form>
      </motion.div>

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
