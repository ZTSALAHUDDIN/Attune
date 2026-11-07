import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/app-shell';
import { supabase } from '@/integrations/supabase/client';
import { buildInsights, loadReviewData, schedule, type Insight, type ReviewCard } from '@/lib/review';
import { CalendarDays } from 'lucide-react';

export const Route = createFileRoute('/_app/review')({ head: () => ({ meta: [{ title: 'Review — Attune' }, { name: 'description', content: 'Spaced-repetition flashcards for topics you missed.' }, { property: 'og:title', content: 'Review — Attune' }, { property: 'og:description', content: 'Revisit weak topics at the right time.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Review });

function Review() {
  const [cards, setCards] = useState<ReviewCard[]>([]); const [insights, setInsights] = useState<Insight[]>([]); const [flip, setFlip] = useState(false);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { void loadReviewData().then(d => { setCards(d.cards); setInsights(buildInsights(d.answers, d.cards)); }).catch(() => setError('Could not load your review cards.')).finally(() => setLoading(false)); }, []);
  const due = cards.filter(c => new Date(c.due_at).getTime() <= Date.now()); const card = due[0];
  async function grade(g: 0 | 1 | 2 | 3) { if (!card || busy) return; setBusy(true); setError(''); const u = schedule(card, g); const result = await supabase.from('review_cards').update(u).eq('id', card.id); if (result.error) setError('Your review could not be saved. Try again.'); else { setCards(cs => cs.map(c => c.id === card.id ? { ...c, ...u } : c)); setFlip(false); } setBusy(false); }
  return <><PageHeading eyebrow="Spaced repetition" title="Review" description={`${due.length} card${due.length === 1 ? '' : 's'} due`} />
    {insights.length > 0 && <ul className="mb-8 grid gap-2">{insights.map((i, k) => <li key={k} className="rounded-md border bg-card px-4 py-3 text-sm">{i.text}</li>)}</ul>}
    {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
    {loading ? <p className="py-8 text-sm text-muted-foreground">Loading reviews…</p> : card ? <div className="mx-auto max-w-xl rounded-lg border bg-card p-8 surface-shadow"><p className="text-xs font-bold uppercase text-primary">{card.topic}</p><h2 className="mt-3 font-display text-xl font-bold">{card.front}</h2>{flip ? <><p className="mt-5 whitespace-pre-wrap rounded-md bg-secondary p-4 text-sm">{card.back}</p><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">{(['Again', 'Hard', 'Good', 'Easy'] as const).map((l, g) => { const next = schedule(card, g as 0 | 1 | 2 | 3); return <Button key={l} disabled={busy} className="h-auto flex-col py-3" variant={g === 2 ? 'default' : 'outline'} onClick={() => grade(g as 0 | 1 | 2 | 3)}>{l}<span className="text-[10px]">{next.interval_days === 0 ? '10 min' : `${next.interval_days} day${next.interval_days === 1 ? '' : 's'}`}</span></Button>; })}</div></> : <Button className="mt-6 w-full" onClick={() => setFlip(true)}>Show answer</Button>}</div>
      : <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Nothing due. Missed quiz questions will appear here automatically.</p>}
    <section className="mt-10"><h2 className="flex items-center gap-2 font-display text-lg font-bold"><CalendarDays size={20} /> Review schedule</h2>
      <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-3">{Array.from({ length: 7 }, (_, i) => { const day = new Date(); day.setDate(day.getDate() + i); const scheduled = cards.filter(c => new Date(c.due_at).toDateString() === day.toDateString() || (i === 0 && new Date(c.due_at) < day)); return <div key={i} className="min-w-0 border-t-2 border-primary bg-secondary/40 py-4 text-center"><p className="text-[10px] sm:text-xs">{i === 0 ? 'Today' : day.toLocaleDateString(undefined, { weekday: 'short' })}</p><p className="mt-2 text-lg font-bold">{scheduled.length}</p></div>; })}</div>
      <ul className="mt-5 divide-y">{[...cards].sort((a,b) => a.due_at.localeCompare(b.due_at)).map(c => <li key={c.id} className="flex flex-wrap justify-between gap-3 py-4"><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-primary">{c.topic}</p><p className="mt-1 break-words text-sm">{c.front}</p></div><div className="text-right text-xs text-muted-foreground"><p>{new Date(c.due_at).getTime() <= Date.now() ? 'Due now' : new Date(c.due_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p><p className="mt-1">{c.repetitions} reviews · {c.interval_days} day interval</p></div></li>)}</ul>
    </section>
  </>;
}
