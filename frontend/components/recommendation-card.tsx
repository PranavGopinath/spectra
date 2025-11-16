'use client'

import { Film, Music, BookOpen, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { RecommendationItem } from '@/lib/api'

type Recommendation = {
  id: string
  title: string
  subtitle: string
  category: 'movie' | 'book' | 'music'
  rating?: number
  year?: string
  imageUrl: string
}

const categoryIcons = {
  movie: Film,
  book: BookOpen,
  music: Music
}

const categoryColors = {
  movie: 'text-primary',
  book: 'text-accent',
  music: 'text-secondary'
}

// Helper to convert backend RecommendationItem to component Recommendation
function convertToRecommendation(item: RecommendationItem): Recommendation {
  // Map media_type to category
  const categoryMap: Record<string, 'movie' | 'book' | 'music'> = {
    'movie': 'movie',
    'book': 'book',
    'music': 'music'
  }
  
  const category = categoryMap[item.media_type] || 'movie'
  
  // Extract subtitle from metadata or description
  const subtitle = item.metadata?.artist || item.metadata?.author || item.metadata?.director || 
                   item.description.split('.')[0] || 'Unknown'
  
  // Get image URL from metadata or use placeholder
  const imageUrl = item.metadata?.image_url || item.metadata?.poster_url || 
                   item.metadata?.cover_url || '/placeholder.svg'
  
  // Calculate rating from similarity (0-1 scale to 0-10 scale)
  const rating = item.similarity ? Math.round(item.similarity * 10 * 10) / 10 : undefined
  
  return {
    id: item.id,
    title: item.title,
    subtitle: subtitle,
    category: category,
    rating: rating,
    year: item.year?.toString(),
    imageUrl: imageUrl
  }
}

export function RecommendationCard({ 
  recommendation, 
  delay = 0 
}: { 
  recommendation: Recommendation | RecommendationItem
  delay?: number 
}) {
  // Convert if it's a backend RecommendationItem
  const rec: Recommendation = 'category' in recommendation 
    ? recommendation 
    : convertToRecommendation(recommendation)
  
  const Icon = categoryIcons[rec.category]
  
  return (
    <Card 
      className="group relative overflow-hidden bg-card/60 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img 
          src={rec.imageUrl || "/placeholder.svg"} 
          alt={rec.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-90"></div>
        
        <div className="absolute top-2 right-2">
          <div className={`w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center ${categoryColors[rec.category]}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        
        {rec.rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm">
            <Star className="w-3 h-3 text-secondary fill-secondary" />
            <span className="text-xs font-semibold text-foreground">{rec.rating}</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1 text-balance">
          {rec.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {rec.subtitle}
        </p>
        {rec.year && (
          <p className="text-xs text-muted-foreground mt-1">{rec.year}</p>
        )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </Card>
  )
}

