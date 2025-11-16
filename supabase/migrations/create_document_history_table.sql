-- Create document_history table
CREATE TABLE IF NOT EXISTS public.document_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  language TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  text_preview TEXT,
  thumbnail_url TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_document_history_user_id ON public.document_history(user_id);
CREATE INDEX IF NOT EXISTS idx_document_history_created_at ON public.document_history(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to only see their own documents
CREATE POLICY "Users can view their own documents"
  ON public.document_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy to allow users to insert their own documents
CREATE POLICY "Users can insert their own documents"
  ON public.document_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy to allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
  ON public.document_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policy to allow users to update their own documents
CREATE POLICY "Users can update their own documents"
  ON public.document_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
