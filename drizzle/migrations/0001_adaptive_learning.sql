ALTER TABLE public.learning_sessions ADD COLUMN video_id text, ADD COLUMN timed_notes jsonb NOT NULL DEFAULT '[]'::jsonb, ADD COLUMN last_position_seconds integer NOT NULL DEFAULT 0;

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid REFERENCES public.learning_sessions(id) ON DELETE SET NULL,
  video_title text NOT NULL DEFAULT '',
  score integer NOT NULL,
  total integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own quiz attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  attempt_id uuid REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  topic text NOT NULL,
  question text NOT NULL,
  correct_answer text NOT NULL,
  explanation text NOT NULL DEFAULT '',
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_answers TO authenticated;
GRANT ALL ON public.quiz_answers TO service_role;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own quiz answers" ON public.quiz_answers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.review_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  topic text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  ease real NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  due_at timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, front)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_cards TO authenticated;
GRANT ALL ON public.review_cards TO service_role;
ALTER TABLE public.review_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own review cards" ON public.review_cards FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());