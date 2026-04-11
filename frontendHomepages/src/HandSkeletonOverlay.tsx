import { useEffect, useRef, type RefObject } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;
};

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/**
 * MediaPipe hand skeleton on the camera (like supportbackend drawing).
 * Classification still comes from the Python API.
 */
export function HandSkeletonOverlay({ videoRef, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) {
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (c && ctx && c.width > 0 && c.height > 0) {
        ctx.clearRect(0, 0, c.width, c.height);
      }
      return;
    }

    let disposed = false;
    let raf = 0;
    let landmarker: HandLandmarker | null = null;

    const run = async () => {
      try {
        const wasm = await FilesetResolver.forVisionTasks(WASM_BASE);
        if (disposed) return;
        landmarker = await HandLandmarker.createFromOptions(wasm, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch {
        return;
      }

      const loop = (now: number) => {
        if (disposed || !landmarker) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.videoWidth < 8 || video.videoHeight < 8) {
          raf = requestAnimationFrame(loop);
          return;
        }

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          raf = requestAnimationFrame(loop);
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const result = landmarker.detectForVideo(video, now);
        const w = canvas.width;
        const h = canvas.height;

        for (const hand of result.landmarks) {
          ctx.strokeStyle = "rgba(0, 230, 200, 0.92)";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          for (const { start, end } of HandLandmarker.HAND_CONNECTIONS) {
            const a = hand[start];
            const b = hand[end];
            if (!a || !b) continue;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }

          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          for (const pt of hand) {
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        raf = requestAnimationFrame(loop);
      };

      raf = requestAnimationFrame(loop);
    };

    void run();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      landmarker?.close();
    };
  }, [active, videoRef]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover"
      aria-hidden
    />
  );
}
