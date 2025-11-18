'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Bookmark, Trash2, TrendingUp } from 'lucide-react';
import { getUserRatings, deleteRating, UserRatingWithItem, UserResponse } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import TasteRadar from './TasteRadar';
import RecommendationCard from './RecommendationCard';
import MediaMosaic from './MediaMosaic';
import { Card } from '@/components/ui/card';

interface UserProfileProps {
  user: UserResponse;
  dimensionNames: string[];
  onRatingDeleted?: () => void;
}

export default function UserProfile({ user, dimensionNames, onRatingDeleted }: UserProfileProps) {
  const [ratings, setRatings] = useState<UserRatingWithItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'watchlist'>('all');
  const [tasteProfile, setTasteProfile] = useState<any>(null);

  useEffect(() => {
    loadRatings();
  }, [user.id]);

  const loadRatings = async () => {
    try {
      setIsLoading(true);
      const data = await getUserRatings(user.id);
      setRatings(data.ratings);
      
      // Try to load taste profile if user has ratings
      if (data.ratings.length > 0) {
        try {
          const profile = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/${user.id}/taste-profile`);
          if (profile.ok) {
            setTasteProfile(await profile.json());
          }
        } catch {
          // Taste profile not available yet
        }
      }
    } catch (error) {
      console.error('Failed to load ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRating = async (itemId: string) => {
    if (!confirm('Remove this rating?')) return;
    
    try {
      await deleteRating(user.id, itemId);
      setRatings(ratings.filter(r => r.item_id !== itemId));
      onRatingDeleted?.();
    } catch (error) {
      console.error('Failed to delete rating:', error);
      alert('Failed to delete rating');
    }
  };

  const filteredRatings = ratings.filter(rating => {
    if (activeTab === 'favorites') return rating.favorite === true;
    if (activeTab === 'watchlist') return rating.want_to_consume === true;
    return true;
  });

  const favoritesCount = ratings.filter(r => r.favorite).length;
  const watchlistCount = ratings.filter(r => r.want_to_consume).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/60 backdrop-blur-sm border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {user.username || user.email.split('@')[0]}
            </h2>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{ratings.length}</div>
            <div className="text-xs text-muted-foreground">Items Rated</div>
          </div>
        </div>
      </Card>

      {/* Media Mosaic */}
      {filteredRatings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/60 backdrop-blur-sm border-border p-6">
            <MediaMosaic items={filteredRatings} />
          </Card>
        </motion.div>
      )}

      {/* Taste Profile */}
      {tasteProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/60 backdrop-blur-sm border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Your Taste Profile</h3>
              <span className="text-sm text-muted-foreground">({tasteProfile.num_ratings} ratings)</span>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6">
              <TasteRadar 
                tasteVector={tasteProfile.taste_vector} 
                dimensionNames={dimensionNames}
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({ratings.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className="w-4 h-4" />
          Favorites ({favoritesCount})
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'watchlist'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Watchlist ({watchlistCount})
        </button>
      </div>

      {/* Ratings List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filteredRatings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {activeTab === 'all' && 'No ratings yet. Start rating items to build your profile!'}
          {activeTab === 'favorites' && 'No favorites yet.'}
          {activeTab === 'watchlist' && 'Your watchlist is empty.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRatings.map((rating) => (
            <motion.div
              key={rating.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card/60 backdrop-blur-sm border-border p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-foreground mb-1">{rating.item.title}</h4>
                        <p className="text-sm text-muted-foreground">{rating.item.media_type} {rating.item.year && `• ${rating.item.year}`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rating.favorite && (
                          <Heart className="w-5 h-5 text-destructive fill-destructive" />
                        )}
                        {rating.want_to_consume && (
                          <Bookmark className="w-5 h-5 text-primary fill-primary" />
                        )}
                        <button
                          onClick={() => handleDeleteRating(rating.item_id)}
                          className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < rating.rating
                                ? 'text-secondary fill-secondary'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">{rating.rating}/5</span>
                    </div>

                    {rating.notes && (
                      <p className="text-sm text-foreground/70 mb-3 italic">"{rating.notes}"</p>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2">{rating.item.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
