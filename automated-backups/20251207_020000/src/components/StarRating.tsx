import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export const StarRating = ({ 
  rating, 
  onRatingChange, 
  size = "md", 
  disabled = false 
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const handleClick = (starIndex: number) => {
    if (!disabled) {
      onRatingChange(starIndex);
    }
  };

  const handleMouseEnter = (starIndex: number) => {
    if (!disabled) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= (hoverRating || rating);
        
        return (
          <button
            key={starIndex}
            type="button"
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            className={cn(
              "transition-colors duration-200",
              !disabled && "hover:scale-110 cursor-pointer",
              disabled && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors duration-200",
                isFilled 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};