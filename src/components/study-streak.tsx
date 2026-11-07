import { Check, Flame } from 'lucide-react';
import { streak, useLearning } from '@/lib/learning';
import { studyCalendar } from '@/lib/study-calendar';

export function StudyStreak({ compact = false }: { compact?: boolean }) {
  const { sessions, preferences } = useLearning();
  const days = studyCalendar(sessions, new Date(), compact ? 1 : 5);
  const today = days.find(day => day.today);
  const weekCount = days.slice(-7).filter(day => day.studied).length;
  const current = streak(sessions);
  return <section aria-label="Study streak calendar" className="border-b py-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-full bg-chart-2/20 text-chart-2"><Flame size={25} /></span><div><h2 className="font-display text-2xl font-bold">{current} {current === 1 ? 'day' : 'days'} in a row</h2><p className="mt-1 text-sm text-muted-foreground">{today?.studied ? 'You showed up today. Keep your rhythm.' : current ? 'Study today to keep your streak going.' : 'A fresh start is just one lesson away.'}</p></div></div>
      <p className="text-sm"><strong>{weekCount}/7</strong><span className="text-muted-foreground"> days this week</span></p>
    </div>
    <div className="mt-6 grid max-w-2xl grid-cols-7 gap-2">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => <span key={label} className="pb-1 text-center text-xs font-semibold text-muted-foreground">{label}</span>)}
      {days.map(day => <div key={day.key} aria-label={`${day.date.toLocaleDateString('en', { month: 'long', day: 'numeric' })}: ${day.future ? 'Upcoming' : day.studied ? `${day.minutes} minutes studied` : 'No session'}${day.today ? ', Today' : ''}`} title={day.date.toLocaleDateString('en', { month: 'short', day: 'numeric' }) + (day.studied ? ` · ${day.minutes} min` : '')} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md border py-2 ${day.studied ? 'border-primary/30 bg-secondary text-primary' : 'border-border bg-muted/40 text-muted-foreground'} ${day.today ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} ${day.future ? 'opacity-40' : ''}`}><span className="text-xs font-medium">{day.date.getDate()}</span>{day.studied ? <Check size={14} /> : <span className="h-3.5 text-[10px]">{day.today ? 'Today' : '—'}</span>}</div>)}
    </div>
    <div className="mt-5 flex max-w-2xl flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Check size={14} className="text-primary" /> Studied<span className="ml-2 size-2 rounded-full border border-primary" /> Today</span><span>{today?.minutes ?? 0} / {preferences.daily_goal_minutes} minutes today</span></div>
    <div role="progressbar" aria-label="Today's study goal" aria-valuemin={0} aria-valuemax={preferences.daily_goal_minutes} aria-valuenow={Math.min(today?.minutes ?? 0, preferences.daily_goal_minutes)} className="mt-2 h-1.5 max-w-2xl overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (today?.minutes ?? 0) / Math.max(1, preferences.daily_goal_minutes) * 100)}%` }} /></div>
  </section>;
}