CREATE TABLE public.learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  video_url text NOT NULL,
  video_title text NOT NULL DEFAULT 'Untitled lesson',
  notes text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 0,
  emotion_counts jsonb NOT NULL DEFAULT '{"focused":0,"confused":0,"stressed":0,"tired":0}'::jsonb,
  quiz_score integer,
  quiz_total integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_sessions TO authenticated;
GRANT ALL ON public.learning_sessions TO service_role;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their sessions" ON public.learning_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create their sessions" ON public.learning_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update their sessions" ON public.learning_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete their sessions" ON public.learning_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.learning_preferences (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  daily_goal_minutes integer NOT NULL DEFAULT 30,
  camera_enabled boolean NOT NULL DEFAULT false,
  dark_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_preferences TO authenticated;
GRANT ALL ON public.learning_preferences TO service_role;
ALTER TABLE public.learning_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their preferences" ON public.learning_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create their preferences" ON public.learning_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update their preferences" ON public.learning_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());