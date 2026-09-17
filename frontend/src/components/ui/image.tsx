import { cn } from "@/lib/utils";

type ImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  onError?: () => void;
};

export function Image({ src, alt, className, fill, priority, onError }: ImageProps) {
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full", className)}
        loading={priority ? "eager" : "lazy"}
        onError={onError}
      />
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={onError} />;
}
