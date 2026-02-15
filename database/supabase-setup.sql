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