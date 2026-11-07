import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const bodySchema = z.object({
  videoTitle: z.string().max(300),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) })).min(1).max(40),
});

export const Route = createFileRoute('/api/tutor')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (!token) return new Response('Unauthorized', { status: 401 });
        const sb = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!, { auth: { persistSession: false } });
        const { data: userData } = await sb.auth.getUser(token);
        if (!userData.user) return new Response('Unauthorized', { status: 401 });
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response('Invalid request', { status: 400 });
        const { streamText } = await import('ai');
        const { createGatewayModel, reasoningOptions } = await import('@/lib/ai.server');
        const result = streamText({
          model: createGatewayModel(),
          instructions: `You are a calm, encouraging tutor helping a student who is watching a YouTube video titled "${parsed.data.videoTitle}". Explain concepts simply, with a short example when helpful. Keep answers brief (under 180 words) and use markdown. If you are unsure what the video says, explain the general concept instead.`,
          messages: parsed.data.messages,
          abortSignal: request.signal,
          providerOptions: reasoningOptions,
        });
        return result.toTextStreamResponse({ headers: { 'Cache-Control': 'no-cache, no-transform' } });
      },
    },
  },
});
