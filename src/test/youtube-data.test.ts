import { describe, expect, it } from 'vitest';
import { readRecommendations, readYouTubeObject } from '@/lib/youtube-data';
import { decodeCaption } from '@/lib/transcript.server';
import { studyCalendar } from '@/lib/study-calendar';

describe('Automatic YouTube data', () => {
  it('extracts complete caption metadata including brackets in titles', () => {
    expect(readYouTubeObject('var ytInitialPlayerResponse = {"title":"[Lesson] }", "captions":{"tracks":[1]}}; other()', 'var ytInitialPlayerResponse =')).toEqual({ title: '[Lesson] }', captions: { tracks: [1] } });
  });
  it('only returns distinct playable alternatives, excluding the current lesson', () => {
    const renderer = (id: string) => ({ videoRenderer: { videoId: id, title: { runs: [{ text: 'Trees explained' }] }, lengthText: { simpleText: '4:20' } } });
    const result = readRecommendations([renderer('abcdefghijk'), renderer('12345678901'), renderer('12345678901'), renderer('bad')], 'abcdefghijk');
    expect(result).toEqual([{ videoId: '12345678901', title: 'Trees explained', channel: '', duration: '4:20' }]);
  });
  it('decodes caption spans and text entities', () => { expect(decodeCaption('<s>Hello &amp; &#119;elcome</s>')).toBe('Hello & welcome'); });
});
describe('Study streak calendar', () => {
  it('aligns columns to Monday and identifies today and study minutes', () => {
    const today = new Date(2026, 9, 19, 12);
    const days = studyCalendar([{ created_at: new Date(2026, 9, 19, 9).toISOString(), duration_seconds: 1500 }], today, 1);
    expect(days[0]?.date.getDay()).toBe(1);
    expect(days[0]).toMatchObject({ key: '2026-10-19', today: true, studied: true, minutes: 25 });
    expect(days[1]?.future).toBe(true);
  });
});