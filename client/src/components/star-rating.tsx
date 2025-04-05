import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

export default function StarRating({ value, onChange, readOnly }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex">
      {stars.map((star) => (
        <Star
          key={star}
          className={cn(
            "h-6 w-6 cursor-pointer transition-colors",
            star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
            readOnly && "cursor-default"
          )}
          onClick={() => {
            if (!readOnly && onChange) {
              onChange(star);
            }
          }}
        />
      ))}
    </div>
  );
}
