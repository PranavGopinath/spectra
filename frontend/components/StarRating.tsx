'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({ 
  value, 
  onChange, 
  size = 40,
  readonly = false 
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const displayValue = hoverValue ?? value;
  
  const handleClick = (starValue: number) => {
    if (!readonly) {
      onChange(starValue);
    }
  };
  
  const handleMouseEnter = (starValue: number) => {
    if (!readonly) {
      setHoverValue(starValue);
    }
  };
  
  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const fullValue = star;
        const halfValue = star - 0.5;
        const isFull = displayValue >= fullValue;
        const isHalf = displayValue >= halfValue && displayValue < fullValue;
        
        return (
          <div
            key={star}
            className="relative"
            style={{ width: size, height: size }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Clickable areas */}
            {!readonly && (
              <>
                <button
                  type="button"
                  onClick={() => handleClick(halfValue)}
                  onMouseEnter={() => handleMouseEnter(halfValue)}
                  className="absolute left-0 top-0 w-1/2 h-full z-10 focus:outline-none"
                  aria-label={`${halfValue} stars`}
                />
                <button
                  type="button"
                  onClick={() => handleClick(fullValue)}
                  onMouseEnter={() => handleMouseEnter(fullValue)}
                  className="absolute right-0 top-0 w-1/2 h-full z-10 focus:outline-none"
                  aria-label={`${fullValue} stars`}
                />
              </>
            )}
            
            {/* Star display using SVG for proper half-star rendering */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="none"
              className="absolute inset-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id={`half-clip-${star}`}>
                  <rect x="0" y="0" width="12" height="24" />
                </clipPath>
              </defs>
              
              {/* Empty star background */}
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="currentColor"
                className="text-muted-foreground/30"
              />
              
              {/* Half star fill (left half) - clipped */}
              {isHalf && (
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor"
                  className="text-secondary"
                  clipPath={`url(#half-clip-${star})`}
                />
              )}
              
              {/* Full star fill */}
              {isFull && (
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor"
                  className="text-secondary"
                />
              )}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
