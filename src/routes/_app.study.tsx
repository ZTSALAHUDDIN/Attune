import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Bot, Camera, CameraOff, ChevronRight, Clock3, Coffee, Link2, Pause, Play, RotateCcw, Send, Square, Timer, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeading } from '@/components/app-shell';
import { formatTime, useLearning, type Counts, type Study } from '@/lib/learning';
import { supabase } from '@/integrations/supabase/client';
import { MotivationNote, TechniquePicker } from '@/components/study-preferences';
import { durations } from '@/lib/study-techniques';
import { fetchTranscript } from '@/lib/learning.functions';
import { useServerFn } from '@tanstack/react-start';
import { useStudyTimer } from '@/hooks/use-study-timer';
import { LessonRecommendations } from '@/components/lesson-recommendations';
import { useExpressionMonitor } from '@/hooks/use-expression-monitor';
import type { Suggestion } from '@/lib/expression';

export const Route = createFileRoute('/_app/study')({ head: () => ({ meta: [{ title: 'Study session — Attune' }, { name: 'description', content: 'Watch a lesson, take timestamped notes, get gentle support, and test your understanding.' }, { property: 'og:title', content: 'Study session — Attune' }, { property: 'og:description', content: 'A calmer space to learn from videos.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: StudyPage });

function getId(value: string) { try { const url = new URL(value); if (['youtu.be', 'www.youtu.be'].includes(url.hostname)) return url.pathname.slice(1).split('/')[0]; if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) { if (url.pathname === '/watch') return url.searchParams.get('v'); if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2]; } } catch { /* invalid */ } return null; }
const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const quotes = ['Small steps every day add up to big results.', 'You don’t have to be perfect — just keep going.', 'Curiosity is the engine of learning.', 'Focus on progress, not perfection.', 'One more minute of focus is a win.'];


type YTPlayer = { getCurrentTime: () => number; getDuration: () => number; seekTo: (s: number, a: boolean) => void; playVideo: () => void; pauseVideo: () => void; getVideoData: () => { title?: string }; destroy: () => void };
declare global { interface Window { YT?: { Player: new (el: HTMLElement, o: unknown) => YTPlayer }; onYouTubeIframeAPIReady?: () => void } }
function loadYT() { return new Promise<void>(res => { if (window.YT?.Player) return res(); const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { prev?.(); res(); }; if (!document.getElementById('yt-api')) { const s = document.createElement('script'); s.id = 'yt-api'; s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s); } }); }

type Popup = { kind: 'tired' | 'confused' | 'alternative' | 'quiz' | 'motivate' | 'break'; text: string };
const moodLabel = { focused: '🙂 Steady & focused', confused: '🤔 Looks puzzled', stressed: '😣 Looks tense', tired: '😴 Looks tired' } as const;
const suggestionPopup: Record<Suggestion, Popup> = {
  steady: { kind: 'motivate', text: 'Your focus has been steady for a while — great rhythm. Keep going!' },
  difficulty: { kind: 'confused', text: 'This part looks a little tricky. Want the AI tutor to explain it another way?' },
  alternative: { kind: 'alternative', text: 'Still looks challenging. A different teacher might click better — want to see other videos on this topic?' },
  break: { kind: 'break', text: 'You seem a bit tired or tense. A short break could help you come back fresher.' },
};

function StudyPage() {
  const { study, setStudy, saveStudy, user, preferences } = useLearning();
  const navigate = useNavigate();
  const retrieveCaptions = useServerFn(fetchTranscript);
  const [recommendations, setRecommendations] = useState(false);
  const [captionAttempt, setCaptionAttempt] = useState(0);
  const [link, setLink] = useState(''); const [error, setError] = useState(''); const [paused, setPaused] = useState(false);
  const [tab, setTab] = useState<'notes' | 'tutor' | 'transcript'>('notes');
  const [camera, setCamera] = useState(false); const [cameraPrompt, setCameraPrompt] = useState(false);
  const [transcriptStatus, setTranscriptStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [popup, setPopup] = useState<Popup | null>(null);
  const [tutorSeed, setTutorSeed] = useState<string | null>(null);
  const videoEl = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null);
  const playerHost = useRef<HTMLDivElement>(null); const player = useRef<YTPlayer | null>(null);
  const studyRef = useRef(study); studyRef.current = study;
  const monitor = useExpressionMonitor(videoEl, camera, s => setPopup(p => p ?? suggestionPopup[s]), mood => setStudy(s => s ? { ...s, counts: { ...s.counts, [mood]: s.counts[mood] + 1 } } : s));

  const timing = durations(preferences.study_technique, preferences.focus_minutes, preferences.break_minutes);
  const pomodoro = useStudyTimer(timing.focus, timing.rest, kind => { if (kind === 'break') { player.current?.pauseVideo(); setPaused(true); } setPopup(kind === 'break' ? { kind: 'break', text: `Focus block complete — nice work! Time for a ${timing.rest}-minute break.` } : { kind: 'motivate', text: 'Break’s over. Ready to dive back in?' }); });

  // Study timer
  useEffect(() => { if (!study || paused) return; const i = setInterval(() => setStudy(s => s ? { ...s, seconds: s.seconds + 1 } : s), 1000); return () => clearInterval(i); }, [study?.id, paused]);
  useEffect(() => { if (paused) pomodoro.pauseFocus(); else pomodoro.resumeFocus(); }, [paused]);
  useEffect(() => { if (!study || paused || popup || study.seconds === 0 || study.seconds % 1200 !== 0) return; setPopup({ kind: 'motivate', text: preferences.motivation || quotes[Math.floor(study.seconds / 1200) % quotes.length] || 'Keep going, one step at a time.' }); }, [study?.seconds]);
  // Autosave so every viewed video lands in the library
  useEffect(() => { if (!study) return; void saveStudy(study, undefined, undefined, false).catch(() => {}); const i = setInterval(() => { const s = studyRef.current; if (s) void saveStudy({ ...s, position: player.current?.getCurrentTime() ?? s.position }, undefined, undefined, false).catch(() => {}); }, 30000); return () => clearInterval(i); }, [study?.id]);
  // YouTube player
  useEffect(() => {
    if (!study?.videoId) return; let cancelled = false;
    void loadYT().then(() => {
      if (cancelled || !playerHost.current || !window.YT) return;
      const el = document.createElement('div'); playerHost.current.innerHTML = ''; playerHost.current.appendChild(el);
      player.current = new window.YT.Player(el, { videoId: study.videoId, host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%', playerVars: { rel: 0, start: Math.floor(study.position) },
        events: { onReady: (e: { target: YTPlayer }) => { const t = e.target.getVideoData()?.title; if (t) setStudy(s => s ? { ...s, title: t } : s); }, onStateChange: (e: { data: number }) => { if (e.data === 1) { setPaused(false); } if (e.data === 2) { setPaused(true); } if (e.data === 0) { setPaused(true); setPopup({ kind: 'quiz', text: 'Lesson complete. Ready to check your understanding?' }); } } } });
    });
    return () => { cancelled = true; player.current?.destroy(); player.current = null; };
  }, [study?.videoId]);
  useEffect(() => () => { stream.current?.getTracks().forEach(t => t.stop()); }, []);
  useEffect(() => { if (videoEl.current && stream.current) videoEl.current.srcObject = stream.current; }, [camera]);

  // Captions load automatically; quizzes fall back to the title when none exist.
  useEffect(() => {
    if (!study?.videoId) return;
    if (study.transcript) { setTranscriptStatus('ready'); return; }
    let cancelled = false; setTranscriptStatus('loading');
    void retrieveCaptions({ data: { videoId: study.videoId } }).then(({ transcript }) => {
      if (cancelled) return;
      setTranscriptStatus(transcript ? 'ready' : 'missing');
      if (transcript) setStudy(s => s?.videoId === study.videoId ? { ...s, transcript } : s);
    }).catch(() => { if (!cancelled) setTranscriptStatus('missing'); });
    return () => { cancelled = true; };
  }, [study?.id, captionAttempt]);
  // Prolonged study without a break
  useEffect(() => { if (study && study.seconds > 0 && study.seconds % 2700 === 0 && pomodoro.mode === 'idle' && !popup) setPopup({ kind: 'break', text: 'You’ve been studying for 45 minutes. A short break helps it stick.' }); }, [study?.seconds]);

  function start() { setPaused(false); pomodoro.reset(); setRecommendations(false); const id = getId(link.trim()); if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) { setError('Paste a valid YouTube video link to begin.'); return; } setStudy({ id: crypto.randomUUID(), videoId: id, url: link.trim(), title: 'YouTube lesson', notes: '', timedNotes: [], position: 0, seconds: 0, counts: { focused: 0, confused: 0, stressed: 0, tired: 0 }, score: null, total: null, transcript: '' }); setError(''); }
  function checkIn(next: keyof Counts) { setStudy(s => s ? { ...s, counts: { ...s.counts, [next]: s.counts[next] + 1 } } : s); if (next === 'tired') setPopup({ kind: 'tired', text: 'Feeling tired? How about a short break?' }); if (next === 'focused') setPopup({ kind: 'motivate', text: 'You’re making progress. Keep going, one concept at a time.' }); if (next === 'stressed') setPopup({ kind: 'break', text: 'A short pause might help. Take a breath and come back when you’re ready.' }); if (next === 'confused') setPopup({ kind: 'confused', text: 'Want to ask the tutor for an explanation?' }); }
  async function enableCamera() { setCameraPrompt(false); try { stream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); setCamera(true); } catch { setError('Camera access was not granted. You can still study without it.'); } }
  function disableCamera() { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setCamera(false); }
  function withPosition(s: Study) { return { ...s, position: player.current?.getCurrentTime() ?? s.position }; }
  async function end() { if (!study) return; try { await saveStudy(withPosition(study)); disableCamera(); navigate({ to: '/summary' }); } catch { setError('Could not save the session. Please try again.'); } }
  function goQuiz() { if (study) { const s = withPosition(study); setStudy(s); void saveStudy(s, undefined, undefined, false).catch(() => {}); } navigate({ to: '/quiz' }); }
  function act(p: Popup) { setPopup(null); if (p.kind === 'tired' || p.kind === 'break') { player.current?.pauseVideo(); setPaused(true); pomodoro.startBreak(); } if (p.kind === 'confused') { setTab('tutor'); setTutorSeed('Can you explain the part I’m stuck on more simply?'); } if (p.kind === 'alternative') { player.current?.pauseVideo(); setPaused(true); setRecommendations(true); } if (p.kind === 'quiz') goQuiz(); }

  if (!study) return <><PageHeading eyebrow="Focus mode" title="Your study session" description="One lesson at a time. You’ve got this." /><div className="mx-auto mt-10 max-w-xl text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-secondary text-primary"><BookOpen size={29} /></span><h2 className="mt-6 font-display text-2xl font-bold">What are we learning today?</h2><p className="mt-2 text-sm text-muted-foreground">Paste a YouTube link — we’ll pick up the title automatically. Past videos live in History.</p><div className="mt-8 rounded-lg border bg-card p-6 text-left surface-shadow"><label className="text-sm font-semibold">YouTube video link<div className="relative mt-2"><Link2 size={17} className="absolute left-3 top-3 text-muted-foreground" /><Input className="h-11 pl-10" placeholder="https://www.youtube.com/watch?v=..." value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && start()} /></div></label>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<Button className="mt-6 h-11 w-full" onClick={start}>Start session <ChevronRight /></Button></div></div></>;

  return <>
    <PageHeading eyebrow="Focus mode" title={study.title} description="Notes are saved with the moment in the video you took them." action={<div className="flex gap-2"><Button variant="outline" onClick={() => { if (paused) player.current?.playVideo(); else player.current?.pauseVideo(); setPaused(!paused); }}>{paused ? <Play /> : <Pause />}{paused ? 'Resume' : 'Pause'}</Button><Button variant="outline" onClick={end}><Square /> End session</Button></div>} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="overflow-hidden rounded-lg border bg-card"><div ref={playerHost} className="aspect-video bg-foreground [&_iframe]:size-full" /><div className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-xs text-muted-foreground">YouTube lesson · {formatTime(study.seconds)} studied</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { player.current?.pauseVideo(); setPaused(true); setRecommendations(true); }}>Another explanation <BookOpen size={16} /></Button><Button onClick={goQuiz} disabled={transcriptStatus === 'loading' || (!study.transcript && study.title === 'YouTube lesson')}>{transcriptStatus === 'loading' ? 'Getting captions…' : !study.transcript && study.title === 'YouTube lesson' ? 'Getting lesson title…' : 'Take quiz'} <ChevronRight /></Button></div></div></div>
        {recommendations && <LessonRecommendations title={study.title} videoId={study.videoId} onClose={() => setRecommendations(false)} />}
        <div className="mt-6 rounded-lg border bg-card"><div className="flex border-b">{(['notes', 'tutor', 'transcript'] as const).map(t => <Button key={t} variant="ghost" className={`rounded-none px-6 ${tab === t ? 'border-b-2 border-primary text-primary' : ''}`} onClick={() => setTab(t)}>{t === 'notes' ? 'Notes' : t === 'transcript' ? 'Transcript' : 'AI tutor'}</Button>)}</div>
          {tab === 'transcript' ? <div className="p-5"><h3 className="text-sm font-semibold">Automatic lesson captions</h3><p role="status" className="mt-2 text-xs text-muted-foreground">{transcriptStatus === 'loading' ? 'Looking for available captions…' : study.transcript ? 'Captions retrieved from YouTube.' : 'Captions aren’t available for this video, so your quiz will be based on the video’s title.'}</p>{study.transcript ? <div className="mt-4 max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">{study.transcript}</div> : <Button className="mt-4" variant="outline" disabled={transcriptStatus === 'loading'} onClick={() => setCaptionAttempt(value => value + 1)}><RotateCcw size={15} /> Retry captions</Button>}</div> : tab === 'notes' ? <Notes study={study} setStudy={setStudy} player={player} /> : <Tutor title={study.title} seed={tutorSeed} onSeedUsed={() => setTutorSeed(null)} />}
        </div>
      </div>
      <aside className="space-y-5"><MotivationNote />
        <section className="rounded-lg border bg-card p-5 surface-shadow"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 size={17} /> Study timer</div><div className="mt-2 font-display text-4xl font-bold tabular-nums">{formatTime(study.seconds)}</div><p className="mt-1 text-xs text-muted-foreground">{paused ? 'Paused' : 'Session in progress'}</p></section>
        <PomodoroCard p={pomodoro} />
        <section className="rounded-lg border bg-card p-5"><div className="flex items-center justify-between"><h3 className="font-display font-bold">How are you feeling?</h3><Button variant="ghost" size="icon" aria-label={camera ? 'Turn camera off' : 'Turn camera on'} onClick={() => camera ? disableCamera() : setCameraPrompt(true)}>{camera ? <CameraOff /> : <Camera />}</Button></div>
          {camera ? <div className="relative mt-3 overflow-hidden rounded-md bg-muted"><video ref={videoEl} autoPlay muted playsInline className="aspect-video w-full -scale-x-100 object-cover" /><span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-destructive px-2 py-1 text-[10px] font-bold text-destructive-foreground"><span className="size-1.5 animate-pulse rounded-full bg-destructive-foreground" /> CAMERA ON · ANALYSED ON-DEVICE</span></div> : <div className="mt-3 flex aspect-video flex-col items-center justify-center rounded-md bg-muted text-muted-foreground"><CameraOff size={23} /><span className="mt-2 text-xs">Camera is off</span></div>}
          {camera && <p role="status" className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">{monitor.status === 'loading' ? 'Starting expression analysis…' : monitor.status === 'no-face' ? 'Can’t see your face — sit facing the camera.' : monitor.status === 'error' ? 'Expression analysis isn’t supported on this device.' : monitor.mood ? moodLabel[monitor.mood] : 'Reading your expressions…'}</p>}
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{camera ? 'Your facial expressions are analysed live on this device to suggest help or breaks. Video is never recorded or uploaded. These are suggestions based on your expression, not a diagnosis.' : 'Turn on the camera to get suggestions based on your facial expressions. Video is never recorded or uploaded.'}</p>
          <p className="mt-4 text-xs font-semibold">Not quite right? Tell us how you feel</p>
          <div className="mt-2 grid grid-cols-2 gap-2">{(['focused', 'confused', 'stressed', 'tired'] as const).map(k => <Button key={k} size="sm" variant="outline" className="capitalize" onClick={() => checkIn(k)}>{k}</Button>)}</div>
        </section>
      </aside>
    </div>
    {popup && <div role="status" className="fixed bottom-20 right-4 z-50 w-[min(360px,calc(100vw-2rem))] animate-in fade-in slide-in-from-bottom-4 rounded-lg border bg-card p-5 shadow-xl md:bottom-6"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">{popup.kind === 'confused' ? <Bot size={18} /> : popup.kind === 'alternative' ? <BookOpen size={18} /> : popup.kind === 'tired' || popup.kind === 'break' ? <Coffee size={18} /> : <ChevronRight size={18} />}</span><p className="flex-1 text-sm leading-relaxed">{popup.text}</p><button aria-label="Dismiss" className="text-muted-foreground" onClick={() => setPopup(null)}><X size={16} /></button></div>{popup.kind === 'confused' && <Button className="mt-3 h-auto whitespace-normal" variant="outline" onClick={() => { player.current?.pauseVideo(); setPaused(true); setRecommendations(true); setPopup(null); }}>Find another explanation <Link2 size={16} /></Button>}{popup.kind !== 'motivate' && <div className="mt-4 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setPopup(null)}>Not now</Button><Button size="sm" onClick={() => act(popup)}>{popup.kind === 'confused' ? 'Ask the tutor' : popup.kind === 'alternative' ? 'Show videos' : popup.kind === 'quiz' ? 'Take quiz' : 'Start break'}</Button></div>}</div>}
    {cameraPrompt && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4"><div role="dialog" aria-modal="true" aria-label="Camera permission" className="w-full max-w-md rounded-lg bg-card p-7 shadow-xl"><div className="flex justify-between"><Camera className="text-primary" /><Button variant="ghost" size="icon" aria-label="Close" onClick={() => setCameraPrompt(false)}><X /></Button></div><h2 className="mt-4 font-display text-xl font-bold">Turn on expression-based suggestions?</h2><ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground"><li>Your facial expressions are analysed in real time, right here on your device.</li><li>Video is never recorded, stored, or uploaded. Only a minute-by-minute summary (focused, puzzled, tense, tired) is saved to your session.</li><li>You’ll get gentle pop-ups: encouragement, the AI tutor, other videos, or a break. Dismiss any of them.</li><li>These are suggestions based on your expression, not a diagnosis. Turn it off anytime.</li></ul><div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={() => setCameraPrompt(false)}>Not now</Button><Button onClick={enableCamera}>Allow camera</Button></div></div></div>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    <span className="hidden">{user?.id}</span>
  </>;
}

function Notes({ study, setStudy, player }: { study: Study; setStudy: React.Dispatch<React.SetStateAction<Study | null>>; player: React.RefObject<YTPlayer | null> }) {
  const [text, setText] = useState(''); const [stamp, setStamp] = useState<number | null>(null);
  function onType(v: string) { if (stamp === null && v) setStamp(player.current?.getCurrentTime() ?? 0); if (!v) setStamp(null); setText(v); }
  function add() { if (!text.trim()) return; const t = stamp ?? player.current?.getCurrentTime() ?? 0; setStudy(s => s ? { ...s, timedNotes: [...s.timedNotes, { id: crypto.randomUUID(), t, text: text.trim() }].sort((a, b) => a.t - b.t) } : s); setText(''); setStamp(null); }
  return <div className="p-5"><div className="flex gap-2"><span className="grid h-10 min-w-14 place-items-center rounded-md bg-secondary px-2 text-xs font-bold tabular-nums text-primary">{clock(stamp ?? 0)}</span><Input className="h-10" placeholder="Type a note — it’s pinned to the current moment" value={text} onChange={e => onType(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} /><Button onClick={add}>Add</Button></div>
    {study.timedNotes.length ? <ul className="mt-4 divide-y">{study.timedNotes.map(n => <li key={n.id} className="flex items-start gap-3 py-3"><button className="rounded bg-secondary px-2 py-1 text-xs font-bold tabular-nums text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => { player.current?.seekTo(n.t, true); player.current?.playVideo(); }} title="Jump to this moment">{clock(n.t)}</button><p className="flex-1 text-sm">{n.text}</p><button aria-label="Delete note" className="text-muted-foreground hover:text-destructive" onClick={() => setStudy(s => s ? { ...s, timedNotes: s.timedNotes.filter(x => x.id !== n.id) } : s)}><Trash2 size={15} /></button></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No notes yet. Click a timestamp later to jump right back to that moment.</p>}
    {study.notes && <p className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-muted-foreground">{study.notes}</p>}
  </div>;
}

type Msg = { role: 'user' | 'assistant'; content: string };
function Tutor({ title, seed, onSeedUsed }: { title: string; seed: string | null; onSeedUsed: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]); const [input, setInput] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const box = useRef<HTMLTextAreaElement>(null); const abort = useRef<AbortController | null>(null);
  useEffect(() => { if (seed) { setInput(seed); onSeedUsed(); } box.current?.focus(); }, [seed]);
  useEffect(() => () => abort.current?.abort(), []);
  async function send() {
    const q = input.trim(); if (!q || busy) return; const next: Msg[] = [...messages, { role: 'user', content: q }]; setMessages([...next, { role: 'assistant', content: '' }]); setInput(''); setBusy(true); setErr('');
    try {
      const { data } = await supabase.auth.getSession(); abort.current = new AbortController();
      const res = await fetch('/api/tutor', { method: 'POST', signal: abort.current.signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` }, body: JSON.stringify({ videoTitle: title, messages: next }) });
      if (!res.ok || !res.body) throw new Error(res.status === 402 ? 'AI credits have run out for now.' : res.status === 429 ? 'The tutor is busy — try again in a moment.' : 'The tutor couldn’t answer right now.');
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = '';
      for (;;) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setMessages([...next, { role: 'assistant', content: acc }]); }
      if (!acc) throw new Error('The tutor didn’t return an answer.');
    } catch (e) { if ((e as Error).name !== 'AbortError') { setErr((e as Error).message); setMessages(next); } }
    finally { setBusy(false); box.current?.focus(); }
  }
  return <div className="flex flex-col p-5"><div className="max-h-96 space-y-4 overflow-y-auto">{messages.length === 0 && <p className="text-sm text-muted-foreground">Ask anything about “{title}”. The tutor explains ideas simply.</p>}{messages.map((m, i) => m.role === 'user' ? <div key={i} className="ml-auto max-w-[85%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">{m.content}</div> : <div key={i} className="prose prose-sm max-w-none text-sm text-foreground dark:prose-invert">{m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="animate-pulse text-muted-foreground">Thinking…</span>}</div>)}</div>
    {err && <p role="alert" className="mt-3 text-sm text-destructive">{err}</p>}
    <div className="mt-4 flex items-end gap-2 rounded-md border p-2"><textarea ref={box} rows={2} className="flex-1 resize-none bg-transparent text-sm outline-none" placeholder="Ask the tutor…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} />{busy ? <Button size="icon" variant="outline" aria-label="Stop" onClick={() => abort.current?.abort()}><Square /></Button> : <Button size="icon" aria-label="Send" onClick={send}><Send /></Button>}</div></div>;
}

function PomodoroCard({ p }: { p: ReturnType<typeof useStudyTimer> }) {
  return <section className="rounded-lg border bg-card p-5"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Timer size={17} /> Focus timer {p.mode === 'break' ? '· Break' : p.mode === 'focus' ? '· Focus' : ''}</div><div className="mt-3"><TechniquePicker /></div><div className={`mt-2 font-display text-3xl font-bold tabular-nums ${p.mode === 'break' ? 'text-chart-4' : ''}`}>{clock(Math.max(0, p.left))}</div><div className="mt-3 flex gap-2">{p.mode === 'idle' ? <><Button size="sm" onClick={p.startFocus}>Focus {p.focusMinutes}</Button><Button size="sm" variant="outline" onClick={p.startBreak}><Coffee /> Break {p.breakMinutes}</Button></> : <><Button size="sm" variant="outline" onClick={p.toggle}>{p.running ? <Pause /> : <Play />}{p.running ? 'Pause' : 'Resume'}</Button><Button size="sm" variant="ghost" onClick={p.reset}><RotateCcw /> Reset</Button></>}</div><p className="mt-2 text-[11px] text-muted-foreground">Focus time is followed by a break. Your video pauses at break time.</p></section>;
}
