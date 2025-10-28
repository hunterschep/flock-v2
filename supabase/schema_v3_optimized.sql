-- ===================================
-- OPTIMIZED SCHEMA V3
-- ===================================
-- Changes from V2:
-- 1. Fixed RLS policies to only grant access to authenticated users
-- 2. Added explicit GRANT statements for table-level permissions
-- 3. Added REVOKE for anon role (security hardening)
-- 4. Added PostgREST schema cache reload

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For password hashing in seed data

-- ===================================
-- INSTITUTIONS TABLE
-- ===================================
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE, -- e.g., "stanford.edu"
  
  -- Optional: Add more institution metadata
  logo_url TEXT,
  website TEXT,
  is_verified BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_institutions_domain ON institutions(domain);

-- ===================================
-- USERS TABLE (MERGED WITH PROFILES)
-- ===================================
CREATE TABLE users (
  -- Identity
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  
  -- Institution
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  grad_year INTEGER NOT NULL CHECK (grad_year >= 1950 AND grad_year <= 2100),
  
  -- Location fields
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'United States',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location GEOGRAPHY(POINT, 4326), -- PostGIS point for proximity queries
  
  -- Current status
  status TEXT CHECK (status IN ('employed', 'grad_school', 'looking', 'other')),
  
  -- Employment info
  employer TEXT,
  job_title TEXT,
  
  -- Grad school info
  program TEXT,
  degree TEXT,
  
  -- Bio and social
  bio TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  personal_website TEXT,
  
  -- Roommate preferences
  looking_for_roommate BOOLEAN DEFAULT FALSE,
  roommate_budget_min INTEGER,
  roommate_budget_max INTEGER,
  roommate_move_date DATE,
  roommate_neighborhoods TEXT[], -- Array of preferred neighborhoods
  
  -- Privacy & Settings
  profile_visible BOOLEAN DEFAULT TRUE, -- Always true, cannot be changed
  show_location BOOLEAN DEFAULT TRUE,
  show_employer BOOLEAN DEFAULT TRUE,
  show_school BOOLEAN DEFAULT TRUE, -- Hide grad school/university name
  
  -- Onboarding & Status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  profile_completeness INTEGER DEFAULT 0, -- 0-100 score
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_location_update TIMESTAMP WITH TIME ZONE, -- Track location changes for 30-day lock
  
  -- Flexible metadata (for future features without schema changes)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Search optimization
  search_vector tsvector, -- For full-text search
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- INDEXES - CRITICAL FOR PERFORMANCE
-- ===================================

-- Basic indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_institution_id ON users(institution_id);
CREATE INDEX idx_users_onboarding_completed ON users(onboarding_completed);
CREATE INDEX idx_users_grad_year ON users(grad_year);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_looking_for_roommate ON users(looking_for_roommate);
CREATE INDEX idx_users_profile_visible ON users(profile_visible);

-- Spatial index (CRITICAL for proximity queries)
CREATE INDEX idx_users_location ON users USING GIST(location);

-- Composite indexes for common query patterns
CREATE INDEX idx_users_institution_onboarding 
  ON users(institution_id, onboarding_completed) 
  WHERE institution_id IS NOT NULL;

CREATE INDEX idx_users_location_onboarding 
  ON users(location, onboarding_completed) 
  WHERE location IS NOT NULL;

CREATE INDEX idx_users_visible_onboarded 
  ON users(profile_visible, onboarding_completed) 
  WHERE profile_visible = TRUE AND onboarding_completed = TRUE;

-- Full-text search index
CREATE INDEX idx_users_search_vector ON users USING GIN(search_vector);

-- Fuzzy text search on name (for typeahead)
CREATE INDEX idx_users_full_name_trgm ON users USING GIN(full_name gin_trgm_ops);

-- JSONB index for metadata queries
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);

-- Activity tracking
CREATE INDEX idx_users_last_active ON users(last_active_at DESC);

-- ===================================
-- USER CONNECTIONS (for blocking, etc)
-- ===================================
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('blocked', 'hidden', 'favorited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, target_user_id, connection_type)
);

CREATE INDEX idx_user_connections_user_id ON user_connections(user_id, connection_type);
CREATE INDEX idx_user_connections_target ON user_connections(target_user_id);

-- ===================================
-- FUNCTIONS & TRIGGERS (MUST BE BEFORE RLS)
-- ===================================

-- Security definer function to get current user's data (bypasses RLS)
-- This MUST be created before RLS policies that reference it
CREATE OR REPLACE FUNCTION get_current_user_data()
RETURNS TABLE (
  institution_id UUID,
  onboarding_completed BOOLEAN,
  location GEOGRAPHY
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT u.institution_id, u.onboarding_completed, u.location
  FROM users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update location from latitude/longitude
CREATE OR REPLACE FUNCTION update_location_from_lat_lng()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness()
RETURNS TRIGGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Basic info (30 points)
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN score := score + 10; END IF;
  IF NEW.grad_year IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.institution_id IS NOT NULL THEN score := score + 10; END IF;
  
  -- Location (20 points)
  IF NEW.city IS NOT NULL AND NEW.state IS NOT NULL THEN score := score + 20; END IF;
  
  -- Status (20 points)
  IF NEW.status IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.status = 'employed' AND NEW.employer IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.status = 'grad_school' AND NEW.program IS NOT NULL THEN score := score + 10; END IF;
  
  -- Bio and social (30 points)
  IF NEW.bio IS NOT NULL AND LENGTH(NEW.bio) > 20 THEN score := score + 15; END IF;
  IF NEW.linkedin_url IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.twitter_url IS NOT NULL OR NEW.personal_website IS NOT NULL THEN score := score + 5; END IF;
  
  NEW.profile_completeness := LEAST(score, 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.employer, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.job_title, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- TABLE-LEVEL PERMISSIONS
-- ===================================

-- Revoke all permissions from anon (security hardening)
REVOKE ALL ON institutions FROM anon;
REVOKE ALL ON users FROM anon;
REVOKE ALL ON user_connections FROM anon;

-- Grant specific permissions to authenticated users only
GRANT SELECT ON institutions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_connections TO authenticated;

-- ===================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================

-- Enable RLS
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Institutions: Authenticated users can read
CREATE POLICY "Institutions are viewable by authenticated users"
  ON institutions FOR SELECT
  TO authenticated
  USING (true);

-- Users: Can read own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users: Can update own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users: Can insert own data (during sign-up)
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users: Can view classmates and nearby users
-- Optimized with security definer function
CREATE POLICY "Users can view classmates and nearby users"
  ON users FOR SELECT
  TO authenticated
  USING (
    id != auth.uid() 
    AND profile_visible = true
    AND onboarding_completed = true
    AND id NOT IN (
      -- Exclude blocked/hidden users
      SELECT target_user_id FROM user_connections 
      WHERE user_id = auth.uid() 
      AND connection_type IN ('blocked', 'hidden')
    )
    AND EXISTS (
      SELECT 1 FROM get_current_user_data() me
      WHERE me.onboarding_completed = true
        AND (
          -- Same institution
          (me.institution_id = users.institution_id AND me.institution_id IS NOT NULL)
          OR
          -- Within 50 miles (80467 meters)
          (me.location IS NOT NULL AND users.location IS NOT NULL 
           AND ST_DWithin(me.location, users.location, 80467))
        )
    )
  );

-- User Connections: Can manage own connections
CREATE POLICY "Users can manage own connections"
  ON user_connections FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===================================
-- TRIGGERS (Apply functions created above)
-- ===================================
CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON institutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_location_from_lat_lng();

CREATE TRIGGER update_users_profile_completeness
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_completeness();

-- Search vector trigger for INSERT (always run)
CREATE TRIGGER update_users_search_vector_insert
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- Search vector trigger for UPDATE (only when relevant fields change)
CREATE TRIGGER update_users_search_vector_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (
    NEW.full_name IS DISTINCT FROM OLD.full_name OR
    NEW.bio IS DISTINCT FROM OLD.bio OR
    NEW.employer IS DISTINCT FROM OLD.employer OR
    NEW.job_title IS DISTINCT FROM OLD.job_title OR
    NEW.city IS DISTINCT FROM OLD.city OR
    NEW.state IS DISTINCT FROM OLD.state
  )
  EXECUTE FUNCTION update_search_vector();

-- ===================================
-- SEED DATA
-- ===================================

-- Add test institutions
INSERT INTO institutions (name, domain) VALUES
  ('Stanford University', 'stanford.edu'),
  ('Massachusetts Institute of Technology', 'mit.edu'),
  ('University of California, Berkeley', 'berkeley.edu'),
  ('Harvard University', 'harvard.edu'),
  ('University of Michigan', 'umich.edu'),
  ('University of Texas at Austin', 'utexas.edu'),
  ('Georgia Institute of Technology', 'gatech.edu'),
  ('Carnegie Mellon University', 'cmu.edu'),
  ('University of Washington', 'uw.edu'),
  ('University of California, Los Angeles', 'ucla.edu'),
  ('Boston College', 'bc.edu')
ON CONFLICT (domain) DO NOTHING;

-- ===================================
-- HELPER FUNCTIONS FOR QUERIES
-- ===================================

-- Function to get nearby users (optimized)
CREATE OR REPLACE FUNCTION get_nearby_users(
  user_location GEOGRAPHY,
  distance_meters INTEGER DEFAULT 80467, -- 50 miles
  max_results INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  distance_miles NUMERIC
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    ROUND((ST_Distance(u.location, user_location) / 1609.34)::NUMERIC, 2) as distance_miles
  FROM users u
  WHERE 
    u.location IS NOT NULL
    AND u.onboarding_completed = TRUE
    AND u.profile_visible = TRUE
    AND ST_DWithin(u.location, user_location, distance_meters)
  ORDER BY u.location <-> user_location
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function for text search
CREATE OR REPLACE FUNCTION search_users(
  search_query TEXT,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  bio TEXT,
  rank REAL
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.bio,
    ts_rank(u.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM users u
  WHERE 
    u.onboarding_completed = TRUE
    AND u.profile_visible = TRUE
    AND u.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- ANALYTICS VIEWS (OPTIONAL)
-- ===================================

-- View for admin analytics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as onboarded_users,
  COUNT(*) FILTER (WHERE profile_visible = true) as visible_users,
  COUNT(*) FILTER (WHERE location IS NOT NULL) as users_with_location,
  COUNT(*) FILTER (WHERE looking_for_roommate = true) as looking_for_roommate,
  COUNT(*) FILTER (WHERE status = 'employed') as employed,
  COUNT(*) FILTER (WHERE status = 'grad_school') as in_grad_school,
  COUNT(*) FILTER (WHERE status = 'looking') as looking_for_work,
  ROUND(AVG(profile_completeness), 2) as avg_profile_completeness,
  COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '7 days') as active_last_7_days,
  COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '30 days') as active_last_30_days
FROM users;

GRANT SELECT ON user_stats TO authenticated;

-- ===================================
-- RELOAD POSTGREST SCHEMA CACHE
-- ===================================
NOTIFY pgrst, 'reload schema';

