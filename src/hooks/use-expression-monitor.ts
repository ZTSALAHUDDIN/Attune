import { useEffect, useRef, useState } from 'react';
import { classifyExpression, initialMonitor, liveMood, observe, type Expression, type Suggestion } from '@/lib/expression';

const VERSION = '1.0.1'; // must match the installed @mediapipe/tasks-vision
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

type Landmarker = { detectForVideo: (v: HTMLVideoElement, t: number) => { faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[] }; close: () => void };

// CHANGED: the model is loaded once and shared, instead of being created and closed
// every time the camera is toggled. Reusing it makes re-enabling the camera instant.
let landmarkerPromise: Promise<Landmarker> | null = null;

function loadLandmarker(): Promise<Landmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const files = await vision.FilesetResolver.forVisionTasks(WASM);
      const create = (delegate: 'GPU' | 'CPU') =>
        vision.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true });
      // CHANGED: fall back to the CPU if the GPU is unavailable instead of failing.
      try { return (await create('GPU')) as unknown as Landmarker; }
      catch { return (await create('CPU')) as unknown as Landmarker; }
    })().catch((error) => { landmarkerPromise = null; throw error; });
  }
  return landmarkerPromise;
}

/** NEW: call this when the study page opens so the model is already downloaded when the camera is switched on. */
export function preloadExpressionModel() {
  if (typeof window !== 'undefined') loadLandmarker().catch(() => { /* retried when the camera is enabled */ });
}

/**
 * Analyses the camera feed on the student's device once per second.
 * Frames never leave the browser and are never stored.
 */
export function useExpressionMonitor(video: React.RefObject<HTMLVideoElement | null>, enabled: boolean, onSuggestion: (s: Suggestion) => void, onMinute: (mood: Expression) => void) {
  const [status, setStatus] = useState<'off' | 'loading' | 'watching' | 'no-face' | 'error'>('off');
  const [mood, setMood] = useState<Expression | null>(null);
  // NEW: fast-reacting mood for the on-screen label (last few seconds only).
  const [live, setLive] = useState<Expression | null>(null);
  const handlers = useRef({ onSuggestion, onMinute }); handlers.current = { onSuggestion, onMinute };
  useEffect(() => {
    if (!enabled) { setStatus('off'); setMood(null); setLive(null); return; }
    let cancelled = false; let timer: ReturnType<typeof setInterval> | undefined;
    let state = initialMonitor(); let tick = 0;
    setStatus('loading');
    (async () => {
      try {
        const landmarker = await loadLandmarker();
        if (cancelled) return;
        setStatus('watching');
        timer = setInterval(() => {
          // NEW: skip work while the tab is hidden to save CPU/GPU.
          if (document.hidden) return;
          const el = video.current;
          if (!el || el.readyState < 2) return;
          const result = landmarker.detectForVideo(el, performance.now());
          const cats = result.faceBlendshapes?.[0]?.categories;
          if (!cats?.length) { setStatus('no-face'); return; }
          setStatus('watching');
          const scores = Object.fromEntries(cats.map(c => [c.categoryName, c.score]));
          const out = observe(state, classifyExpression(scores), Date.now());
          state = out.state; setMood(out.mood);
          setLive(prev => liveMood(state.window) ?? prev);
          if (out.suggestion) handlers.current.onSuggestion(out.suggestion);
          if (++tick % 60 === 0 && out.mood) handlers.current.onMinute(out.mood);
        }, 1000);
      } catch { if (!cancelled) setStatus('error'); }
    })();
    // CHANGED: no landmarker.close() here, because the model is shared and reused.
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [enabled]);
  return { status, mood, live };
}