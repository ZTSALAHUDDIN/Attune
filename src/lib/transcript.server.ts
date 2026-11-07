import { readYouTubeObject } from './youtube-data';
type Track = { baseUrl: string; languageCode: string; kind?: string };
type PlayerResponse = { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: Track[] } } };

export function decodeCaption(text: string) {
  return text.replace(/<[^>]*>/g, '').replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

// Mobile player clients still expose caption tracks to server requests.
const clients = [
  { client: { clientName: 'ANDROID', clientVersion: '20.10.38', androidSdkVersion: 30, hl: 'en' }, ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip' },
  { client: { clientName: 'IOS', clientVersion: '20.10.4', deviceModel: 'iPhone16,2', hl: 'en' }, ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3 like Mac OS X)' },
];

async function tracksFromPlayerApi(videoId: string): Promise<Track[]> {
  for (const { client, ua } of clients) {
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': ua }, body: JSON.stringify({ context: { client }, videoId }) });
      if (!res.ok) continue;
      const json = await res.json() as PlayerResponse;
      const tracks = json.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      if (tracks.length) return tracks;
    } catch { /* try next client */ }
  }
  return [];
}

async function tracksFromWatchPage(videoId: string): Promise<Track[]> {
  try {
    const page = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });
    if (!page.ok) return [];
    const html = await page.text();
    const player = (readYouTubeObject(html, 'var ytInitialPlayerResponse =') ?? readYouTubeObject(html, 'ytInitialPlayerResponse =')) as PlayerResponse | null;
    const match = html.match(/"captionTracks":(\[.*?\])/);
    return player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? (match ? JSON.parse(match[1] ?? '[]') as Track[] : []);
  } catch { return []; }
}

export function parseCaptions(raw: string) {
  if (!raw.trim()) return '';
  if (raw.trim().startsWith('{')) {
    const captions = JSON.parse(raw) as { events?: { segs?: { utf8?: string }[] }[] };
    return (captions.events ?? []).map(e => (e.segs ?? []).map(s => s.utf8 ?? '').join('')).filter(line => line.trim()).join('\n').trim();
  }
  const legacy = [...raw.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)];
  const paragraphs = legacy.length ? legacy : [...raw.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)];
  return paragraphs.map(m => decodeCaption(m[1] ?? '')).filter(line => line.trim()).join('\n').trim();
}

async function download(track: Track) {
  const url = new URL(track.baseUrl);
  if (url.protocol !== 'https:' || !['www.youtube.com', 'youtube.com'].includes(url.hostname) || url.pathname !== '/api/timedtext') return '';
  url.searchParams.set('fmt', 'json3');
  const response = await fetch(url, { redirect: 'error' });
  if (!response.ok) return '';
  return parseCaptions(await response.text());
}

export async function retrieveTranscript(videoId: string) {
  try {
    let tracks = await tracksFromPlayerApi(videoId);
    if (!tracks.length) tracks = await tracksFromWatchPage(videoId);
    const ordered = [
      tracks.find(t => t.languageCode === 'en' && t.kind !== 'asr'),
      tracks.find(t => t.languageCode.startsWith('en')),
      tracks[0],
    ].filter((t, i, all): t is Track => !!t && all.indexOf(t) === i);
    for (const track of ordered) {
      const text = await download(track).catch(() => '');
      if (text) return text;
    }
    return '';
  } catch { return ''; }
}
