"use client";

import { useState, useCallback } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  provider: "youtube" | "vimeo" | string;
  url: string;
  poster?: string | null;
  onProgress?: (seconds: number) => void;
  className?: string;
}

function getEmbedUrl(provider: string, url: string): string {
  if (provider === "youtube") {
    // Handle various YouTube URL formats
    let videoId = "";
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get("v") || "";
      }
    } catch {
      // If URL parsing fails, try to extract ID directly
      const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/
      );
      videoId = match ? match[1] : url;
    }
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
  }

  if (provider === "vimeo") {
    let videoId = "";
    try {
      const urlObj = new URL(url);
      videoId = urlObj.pathname.replace("/", "").split("/")[0];
    } catch {
      const match = url.match(/vimeo\.com\/(\d+)/);
      videoId = match ? match[1] : url;
    }
    return `https://player.vimeo.com/video/${videoId}?byline=0&portrait=0`;
  }

  // Default: use the URL directly as iframe src
  return url;
}

export function VideoPlayer({
  provider,
  url,
  poster,
  onProgress,
  className,
}: VideoPlayerProps) {
  const [showVideo, setShowVideo] = useState(!poster);

  const handlePlay = useCallback(() => {
    setShowVideo(true);
    if (onProgress) {
      onProgress(0);
    }
  }, [onProgress]);

  const embedUrl = getEmbedUrl(provider, url);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl bg-black",
        className
      )}
    >
      {/* 16:9 aspect ratio container */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {!showVideo && poster ? (
          /* Poster image overlay with play button */
          <div className="absolute inset-0">
            <img
              src={poster}
              alt="Video thumbnail"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <button
              onClick={handlePlay}
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                "flex h-16 w-16 items-center justify-center",
                "rounded-full bg-gold/90 text-white shadow-lg",
                "transition-transform hover:scale-110 hover:bg-gold",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              )}
              aria-label="Play video"
            >
              <Play className="ml-1 h-7 w-7" fill="white" />
            </button>
          </div>
        ) : (
          /* Video iframe */
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video player"
          />
        )}
      </div>
    </div>
  );
}
