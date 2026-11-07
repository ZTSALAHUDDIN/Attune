import { useEffect, useState } from 'react';
import { Pin, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLearning } from '@/lib/learning';
import { techniques, type Technique } from '@/lib/study-techniques';

export function MotivationNote() {
  const { preferences, updatePreferences } = useLearning();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(preferences.motivation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setText(preferences.motivation); }, [preferences.motivation]);
  async function save(value: string) {
    setBusy(true); setError('');
    try { await updatePreferences({ motivation: value.trim() }); setEditing(false); }
    catch { setError('Your note could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  return <section className="border border-chart-2/40 bg-chart-2/15 p-5 surface-shadow">
    <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-semibold"><Pin size={16} /> My motivation</h2>
      {preferences.motivation && !editing && <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button><Button variant="ghost" size="icon" aria-label="Remove motivation" disabled={busy} onClick={() => void save('')}><Trash2 size={16} /></Button></div>}
    </div>
    {editing || !preferences.motivation ? <><textarea aria-label="Personal motivation" maxLength={500} rows={3} className="mt-3 w-full resize-none rounded-md border bg-card p-3 text-sm" placeholder="IIT is my dream." value={text} onChange={e => setText(e.target.value)} /><div className="mt-2 flex justify-end gap-2">{preferences.motivation && <Button variant="ghost" size="sm" onClick={() => { setText(preferences.motivation); setEditing(false); }}>Cancel</Button>}<Button size="sm" disabled={busy || !text.trim()} onClick={() => void save(text)}><Save size={15} /> {busy ? 'Saving…' : 'Save note'}</Button></div></> : <p className="mt-4 whitespace-pre-wrap break-words text-lg font-medium leading-relaxed">“{preferences.motivation}”</p>}
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  </section>;
}

export function TechniquePicker({ disabled = false }: { disabled?: boolean }) {
  const { preferences: p, updatePreferences } = useLearning();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState(String(p.focus_minutes));
  const [rest, setRest] = useState(String(p.break_minutes));
  useEffect(() => { setFocus(String(p.focus_minutes)); setRest(String(p.break_minutes)); }, [p.focus_minutes, p.break_minutes]);
  async function update(changes: Parameters<typeof updatePreferences>[0]) {
    setError(''); setBusy(true);
    try { await updatePreferences(changes); } catch { setError('Your study technique could not be saved.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3"><label className="block text-xs font-semibold">Study technique
    <select aria-label="Study technique" disabled={disabled || busy} className="mt-2 h-10 w-full rounded-md border bg-background px-2 text-sm" value={p.study_technique} onChange={e => void update({ study_technique: e.target.value as Technique })}>
      {Object.entries(techniques).map(([key, t]) => <option key={key} value={key}>{t.label}{key !== 'custom' ? ` · ${t.focus}/${t.rest} min` : ''}</option>)}
    </select></label>
    {p.study_technique === 'custom' && <form onSubmit={e => { e.preventDefault(); const f = Number(focus); const r = Number(rest); if (!Number.isInteger(f) || f < 1 || f > 180 || !Number.isInteger(r) || r < 1 || r > 60) { setError('Choose 1–180 focus minutes and 1–60 break minutes.'); return; } void update({ focus_minutes: f, break_minutes: r }); }}><div className="grid grid-cols-2 gap-3"><label className="text-xs">Focus minutes<Input aria-label="Focus minutes" type="number" min={1} max={180} disabled={disabled || busy} value={focus} onChange={e => setFocus(e.target.value)} /></label><label className="text-xs">Break minutes<Input aria-label="Break minutes" type="number" min={1} max={60} disabled={disabled || busy} value={rest} onChange={e => setRest(e.target.value)} /></label></div><Button type="submit" size="sm" variant="outline" className="mt-3" disabled={disabled || busy || (focus === String(p.focus_minutes) && rest === String(p.break_minutes))}><Save size={14} /> {busy ? 'Saving…' : 'Save timing'}</Button></form>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}