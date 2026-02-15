-- Add security columns to files table
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'private', -- 'public', 'private', 'restricted', 'password'
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS allowed_users JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;

-- Create index for faster username lookups (if not already existing on profiles)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Function to check if a user can access a file
CREATE OR REPLACE FUNCTION can_access_file(file_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_file RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT * INTO v_file FROM files WHERE id = file_id;
  
  -- Owner always has access
  IF v_file.owner_id = v_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Public access
  IF v_file.access_level = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Password protected (effectively public for "existence" check, app logic handles password)
  -- But for RLS, we might want to allow reading metadata if they have the link? 
  -- For now, let's say password files are visible to all authenticated users, 
  -- but the *content* download url generation will be gated by app logic validation.
  IF v_file.access_level = 'password' THEN
    RETURN TRUE; 
  END IF;
  
  -- Restricted access
  IF v_file.access_level = 'restricted' THEN
    -- Check if user ID is in the allowed_users JSON array
    IF v_file.allowed_users @> to_jsonb(v_user_id) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Update RLS policy for reading files
DROP POLICY IF EXISTS "Users can view accessible files" ON files;
CREATE POLICY "Users can view accessible files" ON files
  FOR SELECT
  USING (
    auth.uid() = owner_id OR 
    can_access_file(id)
  );

-- Allow users to update their own files (already exists, but ensuring)
-- "Users can manage own files" covers this.
