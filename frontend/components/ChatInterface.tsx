'use client';

import { useState, useRef, useEffect } from 'react';
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
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Spectra</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Cross-domain taste discovery</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              tasteAnalysis={message.tasteAnalysis}
              recommendations={message.recommendations}
              dimensionNames={dimensionNames}
            />
          ))}
          
          {isLoading && (
            <ChatMessage role="assistant" isLoading={true} />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your taste preferences... (e.g., 'I love dark, complex psychological thrillers with deep characters')"
              className="flex-1 resize-none rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}

