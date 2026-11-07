import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Model used by the AI tutor and any other feature that calls createGatewayModel().
export const AI_MODEL = 'gemini-3.6-flash';

// Kept so existing imports keep working. These are OpenAI-specific options;
// the Google provider ignores keys it doesn't recognise, so they are harmless.
export const reasoningOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: 'low',
    reasoningSummary: 'auto',
    store: false,
    include: ['reasoning.encrypted_content'],
  },
} as const;

// Created per request. Name kept as createGatewayModel so tutor.ts and other
// callers don't need to change; it now calls Google's Gemini API directly.
export function createGatewayModel() {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) throw new Error('AI is not configured.');
  const google = createGoogleGenerativeAI({ apiKey });
  return google(AI_MODEL);
}