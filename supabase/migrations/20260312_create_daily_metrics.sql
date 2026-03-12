-- Create daily_metrics table for per-day usage tracking
CREATE TABLE public.daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  entries_count INT DEFAULT 0,
  mentor_messages INT DEFAULT 0,
  tags_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_metrics_user_date ON public.daily_metrics(user_id, date DESC);

-- Enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- RLS: users access own metrics only
CREATE POLICY "Users can view their own daily metrics"
  ON public.daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily metrics"
  ON public.daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily metrics"
  ON public.daily_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily metrics"
  ON public.daily_metrics FOR DELETE
  USING (auth.uid() = user_id);
