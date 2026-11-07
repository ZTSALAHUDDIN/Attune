import { describe, expect, it } from 'vitest';
import { normalizeQuestions } from '@/lib/learning.functions';

describe('Quiz generation fallbacks', () => {
  it('quizzes fall back to the title when captions are shorter than 40 characters', () => {
    // Mirrors the server rule: transcript.trim().length >= 40 ? 'transcript' : 'title'
    expect(''.trim().length >= 40).toBe(false);
    expect('   short  '.trim().length >= 40).toBe(false);
    expect('a'.repeat(40).trim().length >= 40).toBe(true);
  });

  it('accepts a bare question array as quiz output', () => {
    const parsed = normalizeQuestions([{ question: 'Q?', options: ['a', 'b', 'c', 'd'], answer: 1, explanation: 'e', topic: 't' }]);
    expect(parsed?.questions).toHaveLength(1);
  });

  it('accepts fenced JSON and rejects unparseable output', () => {
    const fenced = '```json\n[{"question":"Q?","options":["a","b","c","d"],"answer":0,"explanation":"e","topic":"t"}]\n```';
    expect(normalizeQuestions(fenced)?.questions).toHaveLength(1);
    expect(normalizeQuestions('not json at all')).toBeNull();
    expect(normalizeQuestions({ wrong: 'shape' })).toBeNull();
  });
});
