-- Create career_matrices table (shared career ladder frameworks)
CREATE TABLE public.career_matrices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('public', 'user_uploaded', 'template')),
  source_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create level_definitions table
CREATE TABLE public.level_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matrix_id UUID NOT NULL REFERENCES public.career_matrices ON DELETE CASCADE,
  level_code TEXT NOT NULL,
  level_name TEXT NOT NULL,
  level_order INT NOT NULL,
  scope JSONB DEFAULT '{}',
  technical_expectations TEXT[] DEFAULT '{}',
  leadership_expectations TEXT[] DEFAULT '{}',
  collaboration_expectations TEXT[] DEFAULT '{}',
  visibility_expectations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_career_matrices_company_name ON public.career_matrices (company_name);
CREATE INDEX idx_level_definitions_matrix_order ON public.level_definitions (matrix_id, level_order);

-- Unique constraint: no duplicate level codes within a matrix
ALTER TABLE public.level_definitions
  ADD CONSTRAINT level_definitions_matrix_level_code_unique UNIQUE (matrix_id, level_code);

-- Enable RLS
ALTER TABLE public.career_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_definitions ENABLE ROW LEVEL SECURITY;

-- RLS: anyone authenticated can read career matrices
CREATE POLICY "Anyone can read career matrices"
  ON public.career_matrices FOR SELECT
  USING (true);

-- RLS: only service_role can insert/update/delete career matrices
CREATE POLICY "Service role can insert career matrices"
  ON public.career_matrices FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update career matrices"
  ON public.career_matrices FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete career matrices"
  ON public.career_matrices FOR DELETE
  USING (auth.role() = 'service_role');

-- RLS: anyone authenticated can read level definitions
CREATE POLICY "Anyone can read level definitions"
  ON public.level_definitions FOR SELECT
  USING (true);

-- RLS: only service_role can insert/update/delete level definitions
CREATE POLICY "Service role can insert level definitions"
  ON public.level_definitions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update level definitions"
  ON public.level_definitions FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete level definitions"
  ON public.level_definitions FOR DELETE
  USING (auth.role() = 'service_role');

-- Apply updated_at trigger to career_matrices
CREATE TRIGGER career_matrices_updated_at
  BEFORE UPDATE ON public.career_matrices
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
