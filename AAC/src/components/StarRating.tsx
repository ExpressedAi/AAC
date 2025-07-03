import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (readonly) return;
    
    const newRating = starIndex + (isHalf ? 0.5 : 1);
    onRatingChange(newRating);
  };

  const renderStar = (starIndex: number) => {
    const filled = rating >= starIndex + 1;
    const halfFilled = rating >= starIndex + 0.5 && rating < starIndex + 1;

    return (
      <div key={starIndex} className="relative cursor-pointer">
        <Star
          className={`${sizeClasses[size]} transition-colors duration-200 ${
            filled ? 'fill-yellow-400 text-yellow-400' : 
            halfFilled ? 'fill-yellow-400 text-yellow-400' : 
            'text-gray-300 hover:text-yellow-400'
          }`}
          style={halfFilled ? { clipPath: 'inset(0 50% 0 0)' } : {}}
        />
        {!readonly && (
          <>
            <div
              className="absolute inset-0 w-1/2 left-0"
              onClick={() => handleStarClick(starIndex, true)}
            />
            <div
              className="absolute inset-0 w-1/2 right-0"
              onClick={() => handleStarClick(starIndex, false)}
            />
          </>
        )}
        {halfFilled && (
          <Star
            className={`absolute inset-0 ${sizeClasses[size]} text-gray-300`}
            style={{ clipPath: 'inset(0 0 0 50%)' }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex space-x-1">
      {Array.from({ length: 5 }, (_, i) => renderStar(i))}
      {!readonly && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};