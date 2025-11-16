'use client';

interface RecommendationCardProps {
  item: {
    id: string;
    title: string;
    media_type: string;
    year?: number;
    description: string;
    similarity: number;
    metadata?: Record<string, any>;
  };
  onSelect?: (itemId: string) => void;
}

export default function RecommendationCard({ item, onSelect }: RecommendationCardProps) {
  const similarityPercent = Math.round(item.similarity * 100);
  
  // Get media type emoji
  const mediaTypeEmoji: Record<string, string> = {
    movie: '🎬',
    music: '🎵',
    book: '📚',
  };

  return (
    <div
      className="group relative rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-lg transition-all cursor-pointer"
      onClick={() => onSelect?.(item.id)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{mediaTypeEmoji[item.media_type] || '📄'}</span>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 truncate">
              {item.title}
            </h3>
          </div>
          
          {item.year && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
              {item.year}
            </p>
          )}
          
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
            {item.description}
          </p>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${similarityPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {similarityPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

