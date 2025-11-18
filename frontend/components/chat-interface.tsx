'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Film, Music, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RecommendationCard } from '@/components/recommendation-card'
import { BackgroundVisuals } from '@/components/background-visuals'
import { SpectraLogo } from '@/components/SpectraLogo'
import { 
  analyzeTaste, 
  getRecommendations, 
  generateResponse,
  type TasteAnalysisResponse,
  type RecommendationItem,
  type RecommendationsResponse
} from '@/lib/api'

type Message = {
  id: string
  type: 'user' | 'assistant'
  content: string
  recommendations?: RecommendationItem[]
  tasteAnalysis?: TasteAnalysisResponse
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hey there! I\'m your personal entertainment curator. Tell me what you\'re in the mood for, and I\'ll recommend movies, books, or music that match your vibe. 🎬📚🎵'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      // Analyze taste from user input
      const tasteAnalysis = await analyzeTaste(currentInput)
      
      // Get recommendations based on the input
      const recommendationsResponse = await getRecommendations(currentInput, {
        top_k: 9
      })
      
      // Generate contextual intro for recommendations
      let contextualResponse: string
      try {
        contextualResponse = await generateResponse(
          currentInput,
          tasteAnalysis
        )
      } catch (error) {
        console.warn('Response generation failed, using fallback:', error)
        contextualResponse = 'Based on your interests, here are some recommendations I think you\'ll love:'
      }
      
      // Combine all recommendations into a single array
      const allRecommendations: RecommendationItem[] = [
        ...(recommendationsResponse.movie || []),
        ...(recommendationsResponse.music || []),
        ...(recommendationsResponse.book || [])
      ].sort((a, b) => b.similarity - a.similarity) // Sort by similarity

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: contextualResponse,
        recommendations: allRecommendations.slice(0, 9), // Limit to 9 recommendations
        tasteAnalysis: tasteAnalysis
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error processing request:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again!'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundVisuals />
      
      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-screen max-w-5xl mx-auto p-4 md:p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 animate-fade-in-up">
          <SpectraLogo size="md" animated={true} />
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-card/50 backdrop-blur-sm border border-border">
              <Film className="w-4 h-4 text-primary" />
              <Music className="w-4 h-4 text-secondary" />
              <BookOpen className="w-4 h-4 text-accent" />
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {message.type === 'assistant' ? (
                <div className="max-w-4xl w-full space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                  
                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 ml-11">
                      {message.recommendations.map((rec, idx) => (
                        <RecommendationCard 
                          key={rec.id} 
                          recommendation={rec}
                          delay={idx * 0.1}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-2xl bg-card/80 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 shadow-lg">
                  <p className="text-foreground">{message.content}</p>
                </div>
              )}
            </div>
          ))}
          
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
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e as any)
                    }
                  }}
                  placeholder="What are you in the mood for?"
                  className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground py-2 px-3"
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all duration-300 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
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
    </div>
  )
}

