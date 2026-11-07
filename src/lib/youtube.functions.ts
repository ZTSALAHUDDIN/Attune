import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const findLessons = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ topic: z.string().trim().min(2).max(300), videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/) }).parse(input))
  .handler(async ({ data }) => {
    const { readRecommendations, readYouTubeObject } = await import('./youtube-data');
    const url = new URL('https://www.youtube.com/results');
    url.searchParams.set('search_query', `${data.topic} explained simply educational tutorial`);
    const response = await fetch(url, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });
    if (!response.ok) throw new Error('YouTube suggestions are unavailable right now.');
    const html = await response.text();
    const initial = readYouTubeObject(html, 'var ytInitialData =') ?? readYouTubeObject(html, 'ytInitialData =');
    const lessons = readRecommendations(initial, data.videoId);
    if (!lessons.length) throw new Error('YouTube did not return available lessons. Try a more specific topic.');
    return { lessons };
  });