import { supabase } from '@/integrations/supabase/client';

export type QuizQuestion = { question: string; options: string[]; answer: number; explanation: string; topic: string };
export type ReviewCard = { id: string; topic: string; front: string; back: string; ease: number; interval_days: number; repetitions: number; lapses: number; due_at: string; last_reviewed_at: string | null };
export type AnswerRow = { topic: string; is_correct: boolean; created_at: string };

const norm = (t: string) => t.trim().replace(/\s+/g, ' ');

/** Save a quiz attempt, its answers, and push missed questions into the review deck. */
export async function recordQuiz(userId: string, sessionId: string | null, title: string, questions: QuizQuestion[], answers: number[]) {
  const score = answers.filter((a, i) => a === questions[i]?.answer).length;
  const { data: attempt, error } = await supabase.from('quiz_attempts').insert({ user_id: userId, session_id: sessionId, video_title: title, score, total: questions.length }).select('id').single();
  if (error) throw error;
  const rows = questions.map((q, i) => ({ user_id: userId, attempt_id: attempt.id, topic: norm(q.topic), question: q.question, correct_answer: q.options[q.answer] ?? '', explanation: q.explanation, selected_answer: q.options[answers[i] ?? -1] ?? '', is_correct: answers[i] === q.answer }));
  const { error: answerError } = await supabase.from('quiz_answers').insert(rows);
  if (answerError) throw answerError;
  const missed = rows.filter(r => !r.is_correct);
  if (missed.length) {
    const { data: existing } = await supabase.from('review_cards').select('front, lapses').in('front', missed.map(m => m.question));
    const lapses = new Map((existing ?? []).map(e => [e.front, e.lapses]));
    const { error: cardError } = await supabase.from('review_cards').upsert(missed.map(m => ({
      user_id: userId, topic: m.topic, front: m.question, back: `${m.correct_answer}\n\n${m.explanation}`,
      ease: 2.3, interval_days: 0, repetitions: 0, lapses: (lapses.get(m.question) ?? 0) + 1, due_at: new Date().toISOString(),
    })), { onConflict: 'user_id,front' });
    if (cardError) throw cardError;
  }
  return score;
}

/** SM-2 style scheduling. grade: 0 again, 1 hard, 2 good, 3 easy. Weaker cards come back sooner. */
export function schedule(card: ReviewCard, grade: 0 | 1 | 2 | 3) {
  let { ease, interval_days, repetitions, lapses } = card;
  if (grade === 0) { repetitions = 0; interval_days = 0; lapses += 1; ease = Math.max(1.3, ease - 0.2); }
  else {
    repetitions += 1;
    ease = Math.max(1.3, ease + ([0, -0.15, 0, 0.15][grade] ?? 0));
    interval_days = repetitions === 1 ? (grade === 3 ? 3 : 1) : repetitions === 2 ? (grade === 1 ? 3 : 6) : Math.round(interval_days * ease * (grade === 1 ? 0.7 : grade === 3 ? 1.3 : 1));
    // Frequently missed topics are revisited more often.
    if (lapses >= 3) interval_days = Math.max(1, Math.round(interval_days * 0.6));
  }
  const due = new Date();
  if (interval_days === 0) due.setMinutes(due.getMinutes() + 10); else due.setDate(due.getDate() + interval_days);
  return { ease, interval_days, repetitions, lapses, due_at: due.toISOString(), last_reviewed_at: new Date().toISOString() };
}

export type Insight = { kind: 'weak' | 'improved' | 'due'; topic: string; text: string };
export function buildInsights(answers: AnswerRow[], cards: ReviewCard[]): Insight[] {
  const byTopic = new Map<string, AnswerRow[]>();
  [...answers].sort((a, b) => a.created_at.localeCompare(b.created_at)).forEach(a => { const k = a.topic.toLowerCase(); byTopic.set(k, [...(byTopic.get(k) ?? []), a]); });
  const out: Insight[] = [];
  for (const rows of byTopic.values()) {
    const first = rows[0]; if (!first) continue; const topic = first.topic; const misses = rows.filter(r => !r.is_correct).length;
    if (misses >= 2 && misses / rows.length >= 0.5) out.push({ kind: 'weak', topic, text: `You often miss questions about ${topic}.` });
    if (rows.length >= 4) {
      const half = Math.floor(rows.length / 2);
      const acc = (r: AnswerRow[]) => r.filter(x => x.is_correct).length / r.length;
      const diff = Math.round((acc(rows.slice(half)) - acc(rows.slice(0, half))) * 100);
      if (diff >= 20) out.push({ kind: 'improved', topic, text: `You improved by ${diff}% on ${topic}.` });
    }
  }
  const now = Date.now();
  [...new Set(cards.filter(c => new Date(c.due_at).getTime() <= now).map(c => c.topic))].forEach(topic => out.push({ kind: 'due', topic, text: `${topic} is due for review.` }));
  return out;
}

export async function loadReviewData() {
  const [cards, answers] = await Promise.all([
    supabase.from('review_cards').select('*').order('due_at'),
    supabase.from('quiz_answers').select('topic, is_correct, created_at').order('created_at', { ascending: false }).limit(500),
  ]);
  if (cards.error) throw cards.error;
  if (answers.error) throw answers.error;
  return { cards: (cards.data ?? []) as ReviewCard[], answers: (answers.data ?? []) as AnswerRow[] };
}
