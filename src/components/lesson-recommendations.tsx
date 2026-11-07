import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { BookOpen, Play, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { findLessons } from '@/lib/youtube.functions';
import type { RecommendedLesson } from '@/lib/youtube-data';

export function LessonRecommendations({ title, videoId, onClose }: { title: string; videoId: string; onClose: () => void }) {
  const search = useServerFn(findLessons);
  const [topic, setTopic] = useState(title === 'YouTube lesson' ? '' : title);
  const [lessons, setLessons] = useState<RecommendedLesson[]>([]);
  const [selected, setSelected] = useState<RecommendedLesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function load(query: string) {
    if (query.trim().length < 2) { setError('Enter the topic you want explained.'); return; }
    setBusy(true); setError('');
    try { setLessons((await search({ data: { topic: query, videoId } })).lessons); }
    catch (error) { setError(error instanceof Error ? error.message : 'Suggestions could not be loaded.'); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (topic) void load(topic); }, [videoId]);
  return <section aria-label="Alternative explanations" className="mt-6 border-y py-5">
    <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-display text-lg font-bold"><BookOpen size={19} /> Another way to understand it</h2><p className="mt-1 text-xs text-muted-foreground">{title}</p></div><Button variant="ghost" size="icon" aria-label="Close recommendations" onClick={onClose}><X size={18} /></Button></div>
    <form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); void load(topic); }}><Input aria-label="Recommendation topic" value={topic} onChange={event => setTopic(event.target.value)} placeholder="Topic to explain" /><Button type="submit" variant="outline" size="icon" disabled={busy} aria-label="Find lessons"><Search size={18} /></Button></form>
    {busy && <p role="status" className="py-6 text-sm text-muted-foreground">Finding educational lessons…</p>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    {selected && <div className="mt-5"><iframe key={selected.videoId} className="aspect-video w-full rounded-md border" src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?rel=0&autoplay=1`} title={selected.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /><p className="mt-2 text-sm font-semibold">{selected.title}</p><p className="text-xs text-muted-foreground">{selected.channel}</p></div>}
    {!busy && <div className="mt-5 grid gap-3 sm:grid-cols-2">{lessons.map(lesson => <Button key={lesson.videoId} variant="outline" className={`h-auto items-start justify-start whitespace-normal p-4 text-left ${selected?.videoId === lesson.videoId ? 'border-primary bg-secondary' : ''}`} onClick={() => setSelected(lesson)}><Play size={18} className="mt-1 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-sm leading-relaxed">{lesson.title}</span><span className="mt-2 block text-xs font-normal text-muted-foreground">{lesson.channel} · {lesson.duration}</span></span></Button>)}</div>}
  </section>;
}