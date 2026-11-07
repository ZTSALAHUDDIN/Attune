// Extract a balanced JSON object without depending on YouTube's HTML layout.
export function readYouTubeObject(html: string, marker: string): unknown {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = html.indexOf('{', markerIndex + marker.length);
  if (start < 0) return null;
  let depth = 0; let quoted = false; let escaped = false;
  for (let index = start; index < html.length; index++) {
    const char = html[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) {
      try { return JSON.parse(html.slice(start, index + 1)); } catch { return null; }
    }
  }
  return null;
}

export type RecommendedLesson = { videoId: string; title: string; channel: string; duration: string };
type Text = { simpleText?: string; runs?: { text?: string }[] };
const text = (value?: Text) => value?.simpleText ?? value?.runs?.map(run => run.text ?? '').join('') ?? '';

export function readRecommendations(data: unknown, excludeId: string): RecommendedLesson[] {
  const results = new Map<string, RecommendedLesson>();
  function visit(value: unknown) {
    if (!value || typeof value !== 'object' || results.size >= 6) return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const object = value as Record<string, unknown>;
    const renderer = object['videoRenderer'] as { videoId?: string; title?: Text; ownerText?: Text; lengthText?: Text } | undefined;
    if (renderer?.videoId && /^[a-zA-Z0-9_-]{11}$/.test(renderer.videoId) && renderer.videoId !== excludeId && renderer.lengthText) {
      const title = text(renderer.title);
      if (title) results.set(renderer.videoId, { videoId: renderer.videoId, title, channel: text(renderer.ownerText), duration: text(renderer.lengthText) });
    }
    Object.values(object).forEach(visit);
  }
  visit(data);
  return [...results.values()];
}