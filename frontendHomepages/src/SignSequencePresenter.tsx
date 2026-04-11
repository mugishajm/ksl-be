import { useCallback, useEffect, useMemo, useState } from "react";

type ItemMeta = { sourceIndex?: number };

export type SignPreviewItem =
  | ({
      kind: "letter";
      value: string;
      label: string;
      imageUrl: string | null;
    } & ItemMeta)
  | ({ kind: "space" } & ItemMeta)
  | ({ kind: "other"; value: string } & ItemMeta);

type Speed = "slow" | "normal" | "fast";

const BASE_MS: Record<Speed, number> = {
  slow: 1050,
  normal: 680,
  fast: 420,
};

function stepDurationMs(item: SignPreviewItem, speed: Speed): number {
  const base = BASE_MS[speed];
  if (item.kind === "space") return base + 320;
  if (item.kind === "letter") return base;
  return Math.round(base * 0.72);
}

type Props = {
  items: SignPreviewItem[];
  /** Text used when signs were loaded (1:1 with `items`). */
  sourceSnapshot: string;
  note?: string;
};

export function SignSequencePresenter({
  items,
  sourceSnapshot,
  note,
}: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");

  const len = items.length;
  const current = len > 0 ? items[Math.min(index, len - 1)] : null;
  const highlightCharIndex =
    current?.sourceIndex !== undefined ? current.sourceIndex : index;

  useEffect(() => {
    setIndex(0);
    setPlaying(len > 0);
  }, [items, len]);

  useEffect(() => {
    if (!playing || len === 0) return;
    const item = items[index];
    if (!item) return;
    const ms = stepDurationMs(item, speed);
    const id = window.setTimeout(() => {
      setIndex((i) => {
        if (i >= len - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, ms);
    return () => window.clearTimeout(id);
  }, [playing, index, items, len, speed]);

  const progress = len > 0 ? ((index + 1) / len) * 100 : 0;

  const goPrev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(len - 1, i + 1));
  }, [len]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (p) return false;
      if (len === 0) return false;
      if (index >= len - 1) {
        setIndex(0);
      }
      return true;
    });
  }, [len, index]);

  const restart = useCallback(() => {
    setIndex(0);
    setPlaying(len > 0);
  }, [len]);

  const caption = useMemo(() => {
    if (!current) return "";
    if (current.kind === "letter") return `Letter ${current.label}`;
    if (current.kind === "space") return "Word space";
    return `Symbol “${current.value}”`;
  }, [current]);

  if (len === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-google-gray-200 bg-google-gray-50/40 px-6 text-center">
        <p className="text-sm text-google-gray-500">
          Enter text and tap “Show signs” to play finger-spelling here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative mx-auto aspect-[5/4] w-full max-w-md overflow-hidden rounded-2xl border border-google-gray-200 bg-gradient-to-b from-white to-google-gray-50 google-shadow"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="absolute inset-0 flex flex-col">
          <div className="flex flex-1 items-center justify-center p-6">
            {current?.kind === "letter" ? (
              <div
                key={index}
                className="sign-presenter-step flex h-full w-full items-center justify-center"
              >
                {current.imageUrl ? (
                  <img
                    src={current.imageUrl}
                    alt={`ASL manual alphabet ${current.label}`}
                    className="max-h-[min(220px,40vh)] w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-7xl font-semibold tracking-tight text-google-gray-700">
                    {current.label}
                  </span>
                )}
              </div>
            ) : current?.kind === "space" ? (
              <div
                key={`sp-${index}`}
                className="sign-presenter-step flex flex-col items-center justify-center gap-2 text-google-gray-500"
              >
                <span className="text-4xl font-light">|</span>
                <span className="text-xs font-medium uppercase tracking-widest">
                  Space
                </span>
              </div>
            ) : current?.kind === "other" ? (
              <div
                key={`o-${index}`}
                className="sign-presenter-step flex items-center justify-center"
              >
                <span className="rounded-xl border border-google-gray-200 bg-white px-6 py-4 text-4xl text-google-gray-700">
                  {current.value}
                </span>
              </div>
            ) : null}
          </div>
          <div className="border-t border-google-gray-100 bg-white/90 px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-google-gray-800">{caption}</p>
            <p className="text-xs text-google-gray-500">
              Step {index + 1} of {len}
            </p>
          </div>
        </div>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-google-gray-200"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={len}
      >
        <div
          className="h-full rounded-full bg-google-blue transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={index <= 0}
          className="rounded-full border border-google-gray-200 bg-white px-4 py-2 text-sm font-medium text-google-gray-700 shadow-sm hover:bg-google-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-full bg-google-blue px-6 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index >= len - 1}
          className="rounded-full border border-google-gray-200 bg-white px-4 py-2 text-sm font-medium text-google-gray-700 shadow-sm hover:bg-google-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
        <button
          type="button"
          onClick={restart}
          className="rounded-full border border-google-gray-200 bg-white px-4 py-2 text-sm font-medium text-google-gray-700 shadow-sm hover:bg-google-gray-50"
        >
          Restart
        </button>
        <label className="ml-1 flex items-center gap-2 text-sm text-google-gray-600">
          <span className="sr-only">Speed</span>
          <span aria-hidden>Pace</span>
          <select
            value={speed}
            onChange={(e) =>
              setSpeed(e.target.value as Speed)
            }
            className="rounded-lg border border-google-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-google-blue"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-google-gray-100 bg-white p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-google-gray-500">
          Your text
        </p>
        <div className="max-h-24 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-all font-mono text-sm leading-relaxed text-google-gray-800">
          {Array.from(sourceSnapshot).map((ch, i) => (
            <span
              key={i}
              className={
                i === highlightCharIndex
                  ? "rounded bg-blue-100 px-0.5 text-google-blue ring-2 ring-google-blue/30"
                  : ch === " "
                    ? "inline-block min-w-[0.35em]"
                    : undefined
              }
            >
              {ch === " " ? "\u00a0" : ch === "\n" ? "↵\n" : ch}
            </span>
          ))}
        </div>
      </div>

      {note ? (
        <p className="text-xs leading-relaxed text-google-gray-500">{note}</p>
      ) : null}
    </div>
  );
}
