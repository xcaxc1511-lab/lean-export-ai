import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HeroMediaProps {
  /** Approved 1920×1080 background photograph / video poster. */
  imageUrl?: string | undefined;
  /** Supplied 20–30 second loop; no video is downloaded when unset. */
  videoUrl?: string | undefined;
  className?: string;
}

export function HeroMedia({ imageUrl, videoUrl, className }: HeroMediaProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const image = imageUrl && imageUrl !== "/placeholder.svg" ? imageUrl : undefined;
  const source = videoUrl && !videoUrl.startsWith("YOUR_") ? videoUrl : undefined;

  useEffect(() => {
    if (!source) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (preference.matches) {
        video.current?.pause();
        setPaused(true);
      }
    };
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, [source]);

  return (
    <>
      <div className={cn("absolute inset-0 z-0", className)} aria-hidden="true">
        {image && (
          <img
            src={image}
            alt=""
            width={1920}
            height={1080}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {source && (
          <video
            key={source}
            ref={video}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={image}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          >
            <source src={source} />
          </video>
        )}
      </div>
      {source && (
        <button
          type="button"
          className="absolute bottom-4 right-4 z-30 bg-black/70 text-white px-3 py-2 rounded-sm text-sm"
          aria-label={paused ? "Play background video" : "Pause background video"}
          onClick={() => {
            if (paused)
              void video.current
                ?.play()
                .then(() => setPaused(false))
                .catch(() => setPaused(true));
            else {
              video.current?.pause();
              setPaused(true);
            }
          }}
        >
          {paused ? "Play video" : "Pause video"}
        </button>
      )}
    </>
  );
}
