"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle, ImageIcon } from "lucide-react";

export type Stage1GradcamModelEntry = {
  status: "pending" | "ok" | "error";
  imageSrc?: string;
  error?: string;
};

export type Stage1GradcamPanelPhase = "idle" | "loading" | "complete" | "error";

export type Stage1GradcamGridProps = {
  modelFilenames: readonly string[];
  shortName: (filename: string) => string;
  phase: Stage1GradcamPanelPhase;
  connectionError: string | null;
  byModel: Record<string, Stage1GradcamModelEntry>;
};

export function Stage1GradcamGrid({
  modelFilenames,
  shortName,
  phase,
  connectionError,
  byModel,
}: Stage1GradcamGridProps) {
  if (phase === "idle") return null;

  const okCount = modelFilenames.filter((m) => byModel[m]?.status === "ok").length;
  const errCount = modelFilenames.filter((m) => byModel[m]?.status === "error").length;
  const pendingCount = modelFilenames.filter((m) => byModel[m]?.status === "pending")
    .length;

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-base">Stage 1 · model attention (Grad-CAM)</CardTitle>
        <CardDescription>
          Heatmaps show where each fecal-detection model focuses on your image. Not a
          diagnosis — explainability only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionError ? (
          <div
            className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{connectionError}</span>
          </div>
        ) : null}

        <p className="sr-only" aria-live="polite">
          {phase === "loading"
            ? `Grad-CAM progress: ${okCount + errCount} of ${modelFilenames.length} models.`
            : `Grad-CAM complete: ${okCount} heatmaps ready, ${errCount} unavailable.`}
        </p>

        <p className="text-xs text-muted-foreground">
          {phase === "loading"
            ? `Generating heatmaps… ${okCount + errCount} / ${modelFilenames.length} models`
            : `${okCount} heatmap${okCount === 1 ? "" : "s"} ready · ${errCount} unavailable · ${pendingCount} pending`}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modelFilenames.map((filename) => {
            const entry = byModel[filename] ?? { status: "pending" as const };
            return (
              <div
                key={filename}
                className={cn(
                  "flex flex-col overflow-hidden rounded-lg border border-border/60 bg-muted/10",
                )}
              >
                <div className="border-b border-border/50 bg-muted/30 px-2 py-1.5">
                  <p className="truncate font-mono text-[11px] font-medium text-foreground">
                    {shortName(filename)}
                  </p>
                </div>
                <div className="relative aspect-square w-full bg-muted/20">
                  {entry.status === "pending" && phase === "loading" ? (
                    <Skeleton className="absolute inset-0 size-full rounded-none" />
                  ) : null}
                  {entry.status === "pending" && phase !== "loading" ? (
                    <div className="flex size-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                      Waiting…
                    </div>
                  ) : null}
                  {entry.status === "ok" && entry.imageSrc ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- data URL from API */
                    <img
                      src={entry.imageSrc}
                      alt={`Grad-CAM heatmap for ${shortName(filename)}`}
                      className="size-full object-contain"
                      loading="lazy"
                    />
                  ) : null}
                  {entry.status === "error" ? (
                    <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center">
                      <ImageIcon className="size-8 text-muted-foreground/60" aria-hidden />
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {entry.error ?? "Grad-CAM unavailable"}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
