import {useState} from 'react';
import {Utensils} from 'lucide-react';

interface MenuImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  priority?: boolean;
  darkSurface?: boolean;
}

export function MenuImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  priority = false,
  darkSurface = false,
}: MenuImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 select-none ${
          darkSurface
            ? 'bg-[#26211D] text-[#A3988C]'
            : 'bg-[#EFE9DF] text-[#7A7065]'
        } ${className}`}
        role="img"
        aria-label={alt}
      >
        <Utensils className="w-6 h-6 opacity-60" strokeWidth={1.5} />
        {fallbackLabel ? (
          <span className="text-xs font-medium px-3 text-center line-clamp-1 opacity-75">
            {fallbackLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${
        darkSurface ? 'bg-[#26211D]' : 'bg-[#EFE9DF]'
      } ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
