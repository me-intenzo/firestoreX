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
