-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_embeddings table for RAG vector storage
CREATE TABLE public.document_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('check_in', 'journal_entry', 'goal')),
  source_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_document_embeddings_user ON public.document_embeddings(user_id);
CREATE INDEX idx_document_embeddings_source ON public.document_embeddings(source_type, source_id);
CREATE INDEX idx_document_embeddings_vector ON public.document_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS: users access own embeddings only
CREATE POLICY "Users can view their own embeddings"
  ON public.document_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings"
  ON public.document_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings"
  ON public.document_embeddings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings"
  ON public.document_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- Apply updated_at trigger (reuses existing function from profiles migration)
CREATE TRIGGER document_embeddings_updated_at
  BEFORE UPDATE ON public.document_embeddings
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
