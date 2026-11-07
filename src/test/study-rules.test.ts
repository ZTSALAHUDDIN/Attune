import { describe, expect, it, vi, afterEach } from 'vitest';
import { durations } from '@/lib/study-techniques';
import { schedule, type ReviewCard } from '@/lib/review';

afterEach(() => vi.useRealTimers());
describe('Study techniques', () => {
  it('uses 20 focus minutes and 2 break minutes for short sessions', () => { expect(durations('short', 99, 99)).toMatchObject({ focus: 20, rest: 2 }); });
  it('uses 25 focus minutes and 5 break minutes for Pomodoro', () => { expect(durations('pomodoro', 99, 99)).toMatchObject({ focus: 25, rest: 5 }); });
  it('uses 50 focus minutes and 10 break minutes for long sessions', () => { expect(durations('long', 99, 99)).toMatchObject({ focus: 50, rest: 10 }); });
  it('uses the student-defined durations for custom sessions', () => { expect(durations('custom', 35, 7)).toEqual({ focus: 35, rest: 7 }); });
});
const card: ReviewCard = { id: 'card', topic: 'Trees', front: 'Question', back: 'Answer', ease: 2.3, interval_days: 0, repetitions: 0, lapses: 1, due_at: '', last_reviewed_at: null };
describe('Missed question review schedule', () => {
  it('brings a missed card back in ten minutes when graded again', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T08:00:00Z'));
    expect(schedule(card, 0).due_at).toBe('2026-10-17T08:10:00.000Z');
  });
  it('schedules the first successful review for tomorrow', () => { expect(schedule(card, 2).interval_days).toBe(1); });
  it('gives an easy card a three-day first interval', () => { expect(schedule(card, 3).interval_days).toBe(3); });
});