// Pure, testable rules turning on-device facial blendshape scores into study suggestions.
export type Expression = 'focused' | 'confused' | 'stressed' | 'tired';
export type Scores = Record<string, number>;
export type Suggestion = 'steady' | 'difficulty' | 'alternative' | 'break';

const avg = (s: Scores, a: string, b: string) => ((s[a] ?? 0) + (s[b] ?? 0)) / 2;

/** Estimate one frame's expression pattern from MediaPipe blendshape scores (0–1). */
export function classifyExpression(s: Scores): Expression {
  const blink = avg(s, 'eyeBlinkLeft', 'eyeBlinkRight');
  const jaw = s['jawOpen'] ?? 0;
  if (blink > 0.55 || jaw > 0.6) return 'tired';
  const frown = avg(s, 'mouthFrownLeft', 'mouthFrownRight');
  const stretch = avg(s, 'mouthStretchLeft', 'mouthStretchRight');
  const squint = avg(s, 'eyeSquintLeft', 'eyeSquintRight');
  const innerUp = s['browInnerUp'] ?? 0;
  if (frown > 0.3 || stretch > 0.35 || (innerUp > 0.5 && squint > 0.4)) return 'stressed';
  const browDown = avg(s, 'browDownLeft', 'browDownRight');
  const press = avg(s, 'mouthPressLeft', 'mouthPressRight');
  if (browDown > 0.3 || (innerUp > 0.35 && press > 0.25) || (s['mouthPucker'] ?? 0) > 0.45) return 'confused';
  return 'focused';
}

/** Most common expression in a window, only when it covers at least `share` of samples. */
export function dominant(window: Expression[], share = 0.6): Expression | null {
  if (!window.length) return null;
  const counts = new Map<Expression, number>();
  for (const e of window) counts.set(e, (counts.get(e) ?? 0) + 1);
  let best: Expression | null = null; let n = 0;
  for (const [e, c] of counts) if (c > n) { best = e; n = c; }
  return best && n / window.length >= share ? best : null;
}

/**
 * NEW: quick-reacting mood for the on-screen label only (last few samples).
 * Suggestions and pop-ups still use the slower 20-second window in observe(),
 * so the label feels live without making pop-ups jumpy.
 */
export function liveMood(window: Expression[], recent = 3): Expression | null {
  return dominant(window.slice(-recent), 0.6);
}

export type MonitorState = { window: Expression[]; steadySince: number | null; lastSuggestionAt: number; lastDifficultyAt: number | null };
export const WINDOW = 20; // samples (one per second)
export const COOLDOWN = 120_000;
export const STEADY_AFTER = 300_000;
export const ALTERNATIVE_WITHIN = 300_000;
export const initialMonitor = (): MonitorState => ({ window: [], steadySince: null, lastSuggestionAt: -Infinity, lastDifficultyAt: null });

/** Feed one sample; returns the next state and an optional suggestion to show. */
export function observe(state: MonitorState, sample: Expression | null, now: number): { state: MonitorState; suggestion: Suggestion | null; mood: Expression | null } {
  const window = sample ? [...state.window, sample].slice(-WINDOW) : state.window;
  const mood = window.length >= WINDOW / 2 ? dominant(window) : null;
  let next: MonitorState = { ...state, window, steadySince: mood === 'focused' ? state.steadySince ?? now : null };
  if (now - state.lastSuggestionAt < COOLDOWN || window.length < WINDOW) return { state: next, suggestion: null, mood };
  let suggestion: Suggestion | null = null;
  if (mood === 'tired' || mood === 'stressed') suggestion = 'break';
  else if (mood === 'confused') suggestion = state.lastDifficultyAt !== null && now - state.lastDifficultyAt <= ALTERNATIVE_WITHIN ? 'alternative' : 'difficulty';
  else if (mood === 'focused' && next.steadySince !== null && now - next.steadySince >= STEADY_AFTER) suggestion = 'steady';
  if (suggestion) next = { ...next, window: [], lastSuggestionAt: now, steadySince: suggestion === 'steady' ? now : next.steadySince, lastDifficultyAt: suggestion === 'difficulty' ? now : suggestion === 'alternative' ? null : next.lastDifficultyAt };
  return { state: next, suggestion, mood };
}