"use client";

import { DetectionImagePreview } from "@/components/dashboard/detection-image-preview";
import type { DetectionBoxItem } from "@/components/dashboard/detection-image-preview";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState } from "react";

type RunDetailImageProps = {
  src: string;
  alt: string;
  withOverlay?: false;
} | {
  src: string;
  alt: string;
  withOverlay: true;
  items: DetectionBoxItem[];
};

export function RunDetailImage(props: RunDetailImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full min-h-[min(40vh,320px)]">
      {!loaded ? (
        <Skeleton className="absolute inset-0 z-0 h-full min-h-[min(40vh,320px)] w-full rounded-lg" />
      ) : null}
      {props.withOverlay ? (
        <div className={cn(!loaded && "opacity-0")}>
          <DetectionImagePreview
            objectUrl={props.src}
            items={props.items}
            onImageLoad={() => setLoaded(true)}
          />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- authenticated API URL
        <img
          src={props.src}
          alt={props.alt}
          className={cn(
            "relative z-10 mx-auto block h-auto max-h-[min(70vh,560px)] w-full rounded-lg border border-border/60 object-contain",
            !loaded && "opacity-0",
          )}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
