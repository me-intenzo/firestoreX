-- FirestoreX Consolidated Database Setup
-- Generated on 2026-03-08 by merging the following scripts:
-- 1) supabase-setup.sql
-- 2) update_schema.sql
-- 3) phase2_security_enhancements.sql

-- ======================================================
-- SECTION 1: Base Setup
-- ======================================================
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create profiles table for storing user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid errors)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- FILES TABLE (Secure Storage Metadata)
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Security fields
  access_level TEXT DEFAULT 'private', -- 'public', 'private', 'restricted', 'password'
  password_hash TEXT,
  allowed_users JSONB DEFAULT '[]'::jsonb,
  downloads INTEGER DEFAULT 0
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Final Permissive Policy for Authenticated Users
DROP POLICY IF EXISTS "Authenticated Allow All" ON files;
CREATE POLICY "Authenticated Allow All" ON files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public Read Access (for shared links)
DROP POLICY IF EXISTS "Public Read Access" ON files;
CREATE POLICY "Public Read Access" ON files
  FOR SELECT
  USING (access_level = 'public');


-- ACTIVITY LOGS (Security Auditing)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'danger'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated Logs Access" ON activity_logs;
CREATE POLICY "Authenticated Logs Access" ON activity_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- STORAGE POLICIES
-- Ensure storage.objects and buckets are accessible
-- (These must be run in the SQL editor, they might not work if run via migration tool depending on permissions, but good to document)

-- Allow authenticated users to upload to 'uploads' bucket
-- CREATE POLICY "Authenticated Storage Access" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');
-- CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');


-- FUNCTIONS & TRIGGERS

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Try to get username from metadata, fallback to email prefix
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  
  -- Sanitize username (basic alpha-numeric check could go here, but we'll rely on conflict handling)
  final_username := base_username;
  
  -- Handle username conflicts by appending numbers
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    final_username := base_username || counter;
    counter := counter + 1;
  END LOOP;
  
  INSERT INTO profiles (id, username, email)
  VALUES (NEW.id, final_username, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Log the new user registration
  BEGIN
    INSERT INTO activity_logs (user_id, action, details, severity)
    VALUES (NEW.id, 'USER_REGISTERED', jsonb_build_object('email', NEW.email), 'info');
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create activity log for new user: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================================
-- SECTION 2: Schema Updates
-- ======================================================
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


-- ======================================================
-- SECTION 3: Phase 2 Security Enhancements
-- ======================================================
-- Phase 2 Security Enhancements
-- Add secure file sharing with expiration and token-based access

-- Add new columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE files ADD COLUMN IF NOT EXISTS max_downloads INTEGER;
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;
ALTER TABLE files ADD COLUMN IF NOT EXISTS encryption_metadata JSONB;

-- Create index for share token lookups
CREATE INDEX IF NOT EXISTS idx_files_share_token ON files(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(share_expires_at) WHERE share_expires_at IS NOT NULL;

-- Function to check if share link is valid
CREATE OR REPLACE FUNCTION is_share_link_valid(file_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  file_record RECORD;
BEGIN
  SELECT share_expires_at, max_downloads, downloads 
  INTO file_record
  FROM files 
  WHERE id = file_id;
  
  -- Check expiration
  IF file_record.share_expires_at IS NOT NULL AND file_record.share_expires_at < NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Check download limit
  IF file_record.max_downloads IS NOT NULL AND file_record.downloads >= file_record.max_downloads THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment download count safely
CREATE OR REPLACE FUNCTION increment_downloads(file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE files 
  SET downloads = downloads + 1 
  WHERE id = file_id;
END;
$$ LANGUAGE plpgsql;

-- Policy for share token access
DROP POLICY IF EXISTS "Share Token Access" ON files;
CREATE POLICY "Share Token Access" ON files
  FOR SELECT
  USING (
    share_token IS NOT NULL 
    AND is_share_link_valid(id)
  );

-- Create table for tracking share link access
CREATE TABLE IF NOT EXISTS share_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true
);

ALTER TABLE share_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated Share Logs Access" ON share_access_logs;
CREATE POLICY "Authenticated Share Logs Access" ON share_access_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for share access logs
CREATE INDEX IF NOT EXISTS idx_share_access_logs_file_id ON share_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_share_access_logs_accessed_at ON share_access_logs(accessed_at);

-- Function to clean up expired share links (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE files
  SET share_token = NULL,
      share_expires_at = NULL
  WHERE share_expires_at IS NOT NULL 
    AND share_expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE files IS 'Stores file metadata with enhanced security features including encryption and secure sharing';
COMMENT ON COLUMN files.share_token IS 'Unique token for secure file sharing';
COMMENT ON COLUMN files.share_expires_at IS 'Expiration timestamp for share links';
COMMENT ON COLUMN files.max_downloads IS 'Maximum number of downloads allowed for shared files';
COMMENT ON COLUMN files.is_encrypted IS 'Indicates if file is client-side encrypted';
COMMENT ON COLUMN files.encryption_metadata IS 'Stores encryption algorithm and parameters (not the key)';


-- ======================================================
-- SECTION 4: Share Flow Cross-Browser Fixes
-- ======================================================
-- Share Flow Cross-Browser Fixes
-- Run this after existing setup scripts if your shared links open but file downloads fail.

-- ------------------------------------------------------
-- 1) Allowed-users helper (supports UUID strings and objects)
-- ------------------------------------------------------
CREATE OR REPLACE FUNCTION is_user_in_allowed_users(allowed_users JSONB, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN user_id IS NULL OR allowed_users IS NULL OR jsonb_typeof(allowed_users) <> 'array' THEN FALSE
    ELSE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(allowed_users) AS entry
      WHERE
        (jsonb_typeof(entry) = 'string' AND entry #>> '{}' = user_id::text)
        OR
        (jsonb_typeof(entry) = 'object' AND (
          entry->>'id' = user_id::text
          OR entry->>'user_id' = user_id::text
          OR entry->>'uid' = user_id::text
        ))
    )
  END;
$$;

-- ------------------------------------------------------
-- 2) Refresh can_access_file to support mixed allowed_users shape
-- ------------------------------------------------------
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

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Owner always has access
  IF v_file.owner_id = v_user_id THEN
    RETURN TRUE;
  END IF;

  -- Public files can be read by anyone
  IF v_file.access_level = 'public' THEN
    RETURN TRUE;
  END IF;

  -- Password links are token-based and app-gated by password verification
  IF v_file.access_level = 'password' THEN
    RETURN v_file.share_token IS NOT NULL AND is_share_link_valid(file_id);
  END IF;

  -- Restricted files require allowed, authenticated user
  IF v_file.access_level = 'restricted' THEN
    RETURN v_user_id IS NOT NULL
      AND is_user_in_allowed_users(v_file.allowed_users, v_user_id);
  END IF;

  RETURN FALSE;
END;
$$;

-- ------------------------------------------------------
-- 3) Storage policies for share downloads + owner operations
-- ------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated Storage Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
DROP POLICY IF EXISTS "Uploads Insert Authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Uploads Select Owner" ON storage.objects;
DROP POLICY IF EXISTS "Uploads Select Shared" ON storage.objects;
DROP POLICY IF EXISTS "Uploads Update Owner" ON storage.objects;
DROP POLICY IF EXISTS "Uploads Delete Owner" ON storage.objects;

-- Allow authenticated users to upload into uploads bucket
CREATE POLICY "Uploads Insert Authenticated" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow owners to read their own files
CREATE POLICY "Uploads Select Owner" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads'
  AND EXISTS (
    SELECT 1
    FROM files f
    WHERE f.storage_path = storage.objects.name
      AND f.owner_id = auth.uid()
  )
);

-- Allow shared downloads for public/password links across browsers (anon + auth)
-- Restricted links still require an allowed logged-in user.
CREATE POLICY "Uploads Select Shared" ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'uploads'
  AND EXISTS (
    SELECT 1
    FROM files f
    WHERE f.storage_path = storage.objects.name
      AND f.share_token IS NOT NULL
      AND is_share_link_valid(f.id)
      AND (
        f.access_level IN ('public', 'password')
        OR (
          f.access_level = 'restricted'
          AND auth.uid() IS NOT NULL
          AND (
            f.owner_id = auth.uid()
            OR is_user_in_allowed_users(f.allowed_users, auth.uid())
          )
        )
      )
  )
);

-- Allow owners to update/delete their own storage objects
CREATE POLICY "Uploads Update Owner" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND EXISTS (
    SELECT 1
    FROM files f
    WHERE f.storage_path = storage.objects.name
      AND f.owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'uploads'
  AND EXISTS (
    SELECT 1
    FROM files f
    WHERE f.storage_path = storage.objects.name
      AND f.owner_id = auth.uid()
  )
);

CREATE POLICY "Uploads Delete Owner" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND EXISTS (
    SELECT 1
    FROM files f
    WHERE f.storage_path = storage.objects.name
      AND f.owner_id = auth.uid()
  )
);

