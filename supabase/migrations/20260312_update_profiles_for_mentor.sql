-- US-006: Update profiles table for company and intern support
-- Add company_name, company_size, career_matrix_id columns
-- Update role and target_role CHECK constraints to include 'intern'

-- Add new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT,
  ADD COLUMN IF NOT EXISTS career_matrix_id UUID;

-- Add CHECK constraint on company_size
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_company_size_check
  CHECK (company_size IN ('<50', '50-200', '200-1000', '1000-5000', '5000+'));

-- Add FK from career_matrix_id to career_matrices
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_career_matrix_id_fkey
  FOREIGN KEY (career_matrix_id) REFERENCES public.career_matrices(id) ON DELETE SET NULL;

-- Update role CHECK constraint to include 'intern'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('intern', 'software_engineer_1', 'software_engineer_2', 'senior_engineer', 'staff_engineer', 'principal_engineer'));

-- Update target_role CHECK constraint to include 'intern'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_target_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_target_role_check
  CHECK (target_role IN ('intern', 'software_engineer_1', 'software_engineer_2', 'senior_engineer', 'staff_engineer', 'principal_engineer'));
