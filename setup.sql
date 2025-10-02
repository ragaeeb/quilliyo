-- Create notebooks table
CREATE TABLE notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notebook_id TEXT NOT NULL DEFAULT 'default',
    encrypted BOOLEAN DEFAULT false,
    data TEXT, -- encrypted data
    poems JSONB, -- unencrypted poems
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, notebook_id)
);

-- Enable Row Level Security
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notebooks"
    ON notebooks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notebooks"
    ON notebooks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebooks"
    ON notebooks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebooks"
    ON notebooks FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX idx_notebooks_user_notebook ON notebooks(user_id, notebook_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notebooks_updated_at
    BEFORE UPDATE ON notebooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Create the poem_content_revisions table
CREATE TABLE public.poem_content_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notebook_id TEXT NOT NULL DEFAULT 'default',
  poem_id TEXT NOT NULL,
  
  -- Content at this revision
  content TEXT NOT NULL,
  
  -- Snapshot of key metadata for context
  title TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT poem_content_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT poem_content_revisions_user_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT poem_content_revisions_notebook_fkey FOREIGN KEY (user_id, notebook_id)
    REFERENCES public.notebooks(user_id, notebook_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index for efficient revision lookups (most recent first)
CREATE INDEX idx_poem_revisions_lookup 
  ON public.poem_content_revisions 
  USING btree (user_id, notebook_id, poem_id, revision_number DESC) 
  TABLESPACE pg_default;

-- Ensure unique revision numbers per poem
CREATE UNIQUE INDEX idx_poem_revision_unique 
  ON public.poem_content_revisions 
  USING btree (user_id, notebook_id, poem_id, revision_number) 
  TABLESPACE pg_default;

-- Row Level Security Policies
ALTER TABLE public.poem_content_revisions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own revisions
CREATE POLICY "Users can view own revisions"
  ON public.poem_content_revisions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own revisions
CREATE POLICY "Users can insert own revisions"
  ON public.poem_content_revisions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own revisions
CREATE POLICY "Users can delete own revisions"
  ON public.poem_content_revisions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically manage revision numbers and limit history
CREATE OR REPLACE FUNCTION manage_poem_revision()
RETURNS TRIGGER AS $$
DECLARE
  next_revision INTEGER;
  revision_count INTEGER;
BEGIN
  -- Get the next revision number
  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO next_revision
  FROM poem_content_revisions
  WHERE user_id = NEW.user_id
    AND notebook_id = NEW.notebook_id
    AND poem_id = NEW.poem_id;
  
  NEW.revision_number := next_revision;
  
  -- After insert, check if we need to prune old revisions
  -- Keep only the last 50 revisions per poem
  SELECT COUNT(*)
  INTO revision_count
  FROM poem_content_revisions
  WHERE user_id = NEW.user_id
    AND notebook_id = NEW.notebook_id
    AND poem_id = NEW.poem_id;
  
  IF revision_count > 50 THEN
    DELETE FROM poem_content_revisions
    WHERE id IN (
      SELECT id
      FROM poem_content_revisions
      WHERE user_id = NEW.user_id
        AND notebook_id = NEW.notebook_id
        AND poem_id = NEW.poem_id
      ORDER BY revision_number ASC
      LIMIT (revision_count - 50)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-manage revision numbers
CREATE TRIGGER manage_poem_revision_trigger
  BEFORE INSERT ON poem_content_revisions
  FOR EACH ROW
  EXECUTE FUNCTION manage_poem_revision();

-- Grant necessary permissions (no sequence needed for UUID)
GRANT SELECT, INSERT, DELETE ON public.poem_content_revisions TO authenticated;