'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Music, BookOpen, Search, Star, Sparkles } from 'lucide-react';
import { listItems, getUserRatings, OnboardingMediaItem } from '@/lib/api';
import ItemDetailModal from './ItemDetailModal';
import { Card } from '@/components/ui/card';

interface LibraryViewProps {
  userId: string;
}

type MediaType = 'movie' | 'book' | 'music' | 'all';

const categoryIcons = {
  movie: Film,
  book: BookOpen,
  music: Music
};

const categoryColors = {
  movie: 'text-primary',
  book: 'text-accent',
  music: 'text-secondary'
};

const categoryLabels = {
  movie: 'Movies',
  book: 'Books',
  music: 'Music',
  all: 'All'
};

export default function LibraryView({ userId }: LibraryViewProps) {
  const [items, setItems] = useState<OnboardingMediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<OnboardingMediaItem[]>([]);
  const [selectedType, setSelectedType] = useState<MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [userRatings, setUserRatings] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
    loadUserRatings();
  }, [userId]);

  useEffect(() => {
    filterItems();
  }, [items, selectedType, searchQuery]);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load all items (we'll paginate later if needed)
      const response = await listItems({ limit: 1000 });
      setItems(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserRatings = async () => {
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

  const filterItems = () => {
    let filtered = items;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.media_type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.metadata?.artist?.toLowerCase().includes(query) ||
        item.metadata?.author?.toLowerCase().includes(query) ||
        item.metadata?.director?.toLowerCase().includes(query)
      );
    }

    // Sort by title
    filtered.sort((a, b) => a.title.localeCompare(b.title));

    setFilteredItems(filtered);
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId);
  };

  const handleRatingUpdated = () => {
    loadUserRatings();
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Library</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies, books, music..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'movie', 'book', 'music'] as MediaType[]).map((type) => {
            const Icon = type === 'all' ? null : categoryIcons[type];
            return (
              <motion.button
                key={type}
                onClick={() => setSelectedType(type)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  selectedType === type
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-card/50 text-muted-foreground hover:bg-card/70 hover:text-foreground border border-border'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="font-medium">{categoryLabels[type]}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                <div className="absolute inset-0 blur-xl bg-primary/30 -z-10"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-sm text-muted-foreground">Loading library...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive">{error}</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">
              {searchQuery ? 'No items found matching your search.' : 'No items available.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredItems.map((item, idx) => {
              const category = item.media_type as 'movie' | 'book' | 'music';
              const Icon = categoryIcons[category] || Film;
              const imageUrl = item.metadata?.image_url || item.metadata?.poster_url || 
                               item.metadata?.cover_url || '/placeholder.svg';
              const existingRating = userRatings.get(item.id);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <Card
                    onClick={() => handleItemClick(item.id)}
                    className="group relative overflow-hidden bg-card/60 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-90"></div>
                      
                      <div className="absolute top-2 right-2">
                        <div className={`w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center ${categoryColors[category]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      
                      {existingRating && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm">
                          <Star className="w-3 h-3 text-secondary fill-secondary" />
                          <span className="text-xs font-semibold text-foreground">{existingRating.rating}/5</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-2 text-sm text-balance">
                        {item.title}
                      </h3>
                      {item.year && (
                        <p className="text-xs text-muted-foreground">{item.year}</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          itemId={selectedItem}
          existingRating={userRatings.get(selectedItem)}
          onRatingUpdated={handleRatingUpdated}
        />
      )}
    </div>
  );
}

