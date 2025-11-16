'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Film, Music, Book } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { analyzeTaste, getRecommendations, getDimensions, generateResponse as generateLLMResponse, TasteAnalysisResponse, RecommendationsResponse } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content?: string;
  tasteAnalysis?: TasteAnalysisResponse;
  recommendations?: RecommendationsResponse;
}

export default function ChatInterface() {
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

  // Load dimension names on mount
  useEffect(() => {
    getDimensions().then((dims) => {
      setDimensionNames(dims.map((d) => d.name));
    });
  }, []);

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
      
      // Generate contextual response using LLM
      const conversationHistory = messages
        .filter(m => m.content)
        .map(m => ({
          role: m.role,
          content: m.content!,
        }));
      
      let contextualResponse: string;
      try {
        contextualResponse = await generateLLMResponse(userMessage, tasteAnalysis, conversationHistory);
      } catch (error) {
        // Fallback if LLM fails
        console.warn('LLM response generation failed, using fallback:', error);
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

      // Get recommendations
      const recommendations = await getRecommendations(userMessage, { top_k: 5 });
      
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
          <div className="flex items-center gap-4 text-white/40">
            <Film className="w-5 h-5" />
            <Music className="w-5 h-5" />
            <Book className="w-5 h-5" />
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
    </div>
  );
}
