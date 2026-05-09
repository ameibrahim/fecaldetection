import { STAGE1_MODEL_FILENAMES } from "@/lib/helminth-config";

/** Map API model filename to canonical Stage 1 manifest key (handles casing / path quirks). */
export function resolveStage1ModelFilenameKey(raw: string | undefined | null): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;

  const exact = STAGE1_MODEL_FILENAMES.find((m) => m === t);
  if (exact) return exact;

  const tl = t.toLowerCase();
  const ci = STAGE1_MODEL_FILENAMES.find((m) => m.toLowerCase() === tl);
  if (ci) return ci;

  const base = t.replace(/^.*[/\\]/, "");
  const byBase = STAGE1_MODEL_FILENAMES.find(
    (m) => m === base || m.endsWith(base) || base.endsWith(m),
  );
  return byBase ?? null;
}

type LooseGradcamRecord = Record<string, unknown>;

function asRecord(v: unknown): LooseGradcamRecord | null {
  return v !== null && typeof v === "object" ? (v as LooseGradcamRecord) : null;
}

/** Normalize one Grad-CAM / Grad-CAM-error WebSocket frame from Stage 1 API. */
export function extractGradcamPayload(msg: unknown): {
  type?: string;
  modelKey: string | null;
  imageSrc: string | null;
  errorText: string | null;
  isFinished: boolean;
} {
  const root = asRecord(msg);
  const t = typeof root?.type === "string" ? root.type : undefined;

  if (t === "finished" || root?.status === "finished") {
    return {
      type: t,
      modelKey: null,
      imageSrc: null,
      errorText: null,
      isFinished: true,
    };
  }

  const data = asRecord(root?.data) ?? root;

  const mfRaw =
    (typeof data?.modelFilename === "string" && data.modelFilename) ||
    (typeof data?.model_filename === "string" && data.model_filename) ||
    (typeof root?.modelFilename === "string" && root.modelFilename) ||
    null;

  const modelKey = resolveStage1ModelFilenameKey(mfRaw);

  let imageSrc: string | null = null;
  const rawImg =
    (typeof data?.gradcamImage === "string" && data.gradcamImage) ||
    (typeof data?.gradcam_image === "string" && data.gradcam_image) ||
    (typeof data?.image_base64 === "string" && data.image_base64) ||
    (typeof data?.image === "string" && data.image) ||
    null;

  if (typeof rawImg === "string" && rawImg.length > 0) {
    imageSrc = rawImg.startsWith("data:") ? rawImg : `data:image/png;base64,${rawImg}`;
  }

  const errorText =
    (typeof data?.error === "string" && data.error) ||
    (typeof data?.details === "string" && data.details) ||
    (typeof root?.error === "string" && root.error) ||
    null;

  return {
    type: t,
    modelKey,
    imageSrc,
    errorText,
    isFinished: false,
  };
}
