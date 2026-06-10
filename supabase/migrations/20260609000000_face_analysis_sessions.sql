-- Face analysis sessions: production-grade realtime scan persistence

CREATE TABLE IF NOT EXISTS public.face_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  face_shape TEXT NOT NULL CHECK (face_shape IN ('oval', 'round', 'square', 'rectangle', 'heart', 'diamond', 'triangle')),
  confidence NUMERIC(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.face_analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_face_analysis_sessions_user_id_created_at
  ON public.face_analysis_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_face_analysis_sessions_created_at
  ON public.face_analysis_sessions (created_at DESC);

-- RLS policies
-- Users can read only their own sessions
DROP POLICY IF EXISTS "Users can view their own face analysis sessions" ON public.face_analysis_sessions;
CREATE POLICY "Users can view their own face analysis sessions"
  ON public.face_analysis_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own sessions
DROP POLICY IF EXISTS "Users can insert their own face analysis sessions" ON public.face_analysis_sessions;
CREATE POLICY "Users can insert their own face analysis sessions"
  ON public.face_analysis_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

