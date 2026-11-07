import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Technique } from './study-techniques';

type Emotion = 'focused' | 'confused' | 'stressed' | 'tired';
export type Counts = Record<Emotion, number>;
export type Session = { id: string; user_id: string; video_url: string; video_title: string; notes: string; duration_seconds: number; emotion_counts: Counts; quiz_score: number | null; quiz_total: number | null; created_at: string; ended_at: string | null; video_id: string | null; timed_notes: TimedNote[]; last_position_seconds: number; transcript: string };
export type TimedNote = { id: string; t: number; text: string };
export type Preferences = { daily_goal_minutes: number; camera_enabled: boolean; dark_mode: boolean; motivation: string; study_technique: Technique; focus_minutes: number; break_minutes: number };
export type Study = { id: string; videoId: string; url: string; title: string; notes: string; timedNotes: TimedNote[]; position: number; seconds: number; counts: Counts; score: number | null; total: number | null; transcript: string };
type LearningContext = { user: User | null; loading: boolean; sessions: Session[]; preferences: Preferences; study: Study | null; setStudy: React.Dispatch<React.SetStateAction<Study | null>>; refresh: () => Promise<void>; saveStudy: (study: Study, score?: number, total?: number, finished?: boolean) => Promise<void>; openSession: (s: Session) => void; updatePreferences: (changes: Partial<Preferences>) => Promise<void> };
const Context = createContext<LearningContext | null>(null);
const defaults: Preferences = { daily_goal_minutes: 30, camera_enabled: false, dark_mode: false, motivation: '', study_technique: 'pomodoro', focus_minutes: 25, break_minutes: 5 };
export function LearningProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const preferencesRef = useRef(preferences); preferencesRef.current = preferences;
  const preferenceWrites = useRef<Promise<void>>(Promise.resolve());
  const [study, setStudy] = useState<Study | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); });
    return () => subscription.unsubscribe();
  }, []);
  const refresh = async () => {
    const [sessionResult, prefResult] = await Promise.all([
      supabase.from('learning_sessions').select('*').order('created_at', { ascending: false }),
      supabase.from('learning_preferences').select('*').maybeSingle(),
    ]);
    if (sessionResult.data) setSessions(sessionResult.data as unknown as Session[]);
    if (prefResult.data) setPreferences({ daily_goal_minutes: prefResult.data.daily_goal_minutes, camera_enabled: prefResult.data.camera_enabled, dark_mode: prefResult.data.dark_mode, motivation: prefResult.data.motivation, study_technique: prefResult.data.study_technique as Technique, focus_minutes: prefResult.data.focus_minutes, break_minutes: prefResult.data.break_minutes });
  };
  useEffect(() => { if (user) void refresh(); else { setSessions([]); setPreferences(defaults); } }, [user?.id]);
  useEffect(() => { document.documentElement.classList.toggle('dark', preferences.dark_mode); }, [preferences.dark_mode]);
  const openSession = (s: Session) => setStudy({ id: s.id, videoId: s.video_id ?? '', url: s.video_url, title: s.video_title, notes: s.notes, timedNotes: Array.isArray(s.timed_notes) ? s.timed_notes : [], position: s.last_position_seconds ?? 0, seconds: s.duration_seconds, counts: s.emotion_counts, score: s.quiz_score, total: s.quiz_total, transcript: s.transcript ?? '' });
  const saveStudy = async (current: Study, score?: number, total?: number, finished = true) => {
    if (!user) return;
    const { error } = await supabase.from('learning_sessions').upsert({
      id: current.id, user_id: user.id, video_url: current.url, video_title: current.title,
      notes: current.notes, transcript: current.transcript, video_id: current.videoId, timed_notes: current.timedNotes, last_position_seconds: Math.floor(current.position), duration_seconds: current.seconds, emotion_counts: current.counts,
      quiz_score: score ?? current.score, quiz_total: total ?? current.total, ...(finished ? { ended_at: new Date().toISOString() } : {}),
    });
    if (error) throw error;
    await refresh();
  };
  const updatePreferences = async (changes: Partial<Preferences>) => {
    if (!user) throw new Error('Sign in to save your study preferences.');
    const userId = user.id;
    const write = preferenceWrites.current.catch(() => {}).then(async () => {
      const next = { ...preferencesRef.current, ...changes };
      const { error } = await supabase.from('learning_preferences').upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() });
      if (error) throw error;
      preferencesRef.current = next;
      setPreferences(next);
    });
    preferenceWrites.current = write;
    await write;
  };
  return <Context.Provider value={{ user, loading, sessions, preferences, study, setStudy, refresh, saveStudy, openSession, updatePreferences }}>{children}</Context.Provider>;
}
export function useLearning() { const ctx = useContext(Context); if (!ctx) throw new Error('Learning provider missing'); return ctx; }
export function formatTime(seconds: number) { const h = Math.floor(seconds / 3600); const m = Math.floor(seconds % 3600 / 60); const s = seconds % 60; return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(s).padStart(2, '0')}`; }
export function streak(sessions: Session[]) { const days = new Set(sessions.map(s => new Date(s.created_at).toLocaleDateString('en-CA'))); let count = 0; const date = new Date(); if (!days.has(date.toLocaleDateString('en-CA'))) date.setDate(date.getDate() - 1); while (days.has(date.toLocaleDateString('en-CA'))) { count++; date.setDate(date.getDate() - 1); } return count; }
