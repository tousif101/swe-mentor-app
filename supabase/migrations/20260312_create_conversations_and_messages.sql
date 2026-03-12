-- Create conversations table for AI mentor chat history
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table for chat messages
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_conversations_user_updated ON public.conversations(user_id, updated_at DESC);
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at ASC);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: users access own conversations only
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages RLS: users access messages in their own conversations only
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM public.conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM public.conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update messages in their conversations"
  ON public.messages FOR UPDATE
  USING (conversation_id IN (
    SELECT id FROM public.conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages in their conversations"
  ON public.messages FOR DELETE
  USING (conversation_id IN (
    SELECT id FROM public.conversations WHERE user_id = auth.uid()
  ));

-- Apply updated_at trigger to conversations (reuses existing function from profiles migration)
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
