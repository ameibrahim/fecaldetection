import { resolveStage1ModelFilenameKey } from "@/lib/stage1-gradcam-ws";

type LooseLimeRecord = Record<string, unknown>;

function asRecord(v: unknown): LooseLimeRecord | null {
  return v !== null && typeof v === "object" ? (v as LooseLimeRecord) : null;
}

/**
 * Normalize one LIME WebSocket frame from the Stage 1 API.
 *
 * The exact response shape is not formally documented yet, so we accept any of
 * a few common key spellings for the explanation image (`lime_image`,
 * `image_base64`, `image`) and surface progress + finished signals when present.
 */
export function extractLimePayload(msg: unknown): {
  type?: string;
  modelKey: string | null;
  imageSrc: string | null;
  errorText: string | null;
  isFinished: boolean;
  progressPct: number | null;
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
      progressPct: null,
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
    (typeof data?.limeImage === "string" && data.limeImage) ||
    (typeof data?.lime_image === "string" && data.lime_image) ||
    (typeof data?.image_base64 === "string" && data.image_base64) ||
    (typeof data?.image === "string" && data.image) ||
    null;

  if (typeof rawImg === "string" && rawImg.length > 0) {
    imageSrc = rawImg.startsWith("data:")
      ? rawImg
      : `data:image/png;base64,${rawImg}`;
  }

  const errorText =
    (typeof data?.error === "string" && data.error) ||
    (typeof data?.details === "string" && data.details) ||
    (typeof root?.error === "string" && root.error) ||
    null;

  let progressPct: number | null = null;
  const rawProgress =
    (typeof data?.progress === "number" && data.progress) ||
    (typeof root?.progress === "number" && root.progress) ||
    null;
  if (typeof rawProgress === "number" && Number.isFinite(rawProgress)) {
    progressPct =
      rawProgress <= 1 ? Math.round(rawProgress * 100) : Math.round(rawProgress);
  }

  return {
    type: t,
    modelKey,
    imageSrc,
    errorText,
    isFinished: false,
    progressPct,
  };
}
