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
