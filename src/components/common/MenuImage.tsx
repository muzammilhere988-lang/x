import {useEffect, useState} from 'react';
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

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  if (!src || src === 'no-image' || hasError) {
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
      className={`relative overflow-hidden flex items-center justify-center ${
        darkSurface ? 'bg-[#26211D]' : 'bg-[#F3EDE2]'
      } ${className}`}
    >
      {isLoaded ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover scale-110 blur-md opacity-25 pointer-events-none select-none"
        />
      ) : null}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`relative z-10 h-full w-full object-contain transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
