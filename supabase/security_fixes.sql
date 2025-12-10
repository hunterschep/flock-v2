-- ===================================
-- SECURITY FIXES
-- ===================================
-- Run this to fix Supabase security linter warnings
-- These changes are backwards compatible and won't break the application

-- ===================================
-- FIX 1: Function Search Path Mutable
-- ===================================
-- Add SET search_path = public to prevent search path injection attacks

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix update_location_from_lat_lng
CREATE OR REPLACE FUNCTION update_location_from_lat_lng()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix calculate_profile_completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- Fix update_search_vector
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- Fix get_nearby_users (SECURITY DEFINER function)
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
$$;

-- Fix search_users (SECURITY DEFINER function)
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
$$;

-- Fix update_conversation_timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Fix mark_messages_read (SECURITY DEFINER function)
CREATE OR REPLACE FUNCTION mark_messages_read(
  conv_id UUID,
  reader_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE messages
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE 
    conversation_id = conv_id
    AND sender_id != reader_id
    AND is_read = FALSE;
END;
$$;

-- Fix get_unread_count (SECURITY DEFINER function)
CREATE OR REPLACE FUNCTION get_unread_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE 
    (c.user1_id = user_uuid OR c.user2_id = user_uuid)
    AND m.sender_id != user_uuid
    AND m.is_read = FALSE;
    
  RETURN unread_count;
END;
$$;

-- Fix get_or_create_conversation (SECURITY DEFINER function)
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user_a UUID,
  user_b UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id UUID;
  smaller_id UUID;
  larger_id UUID;
  user1_valid BOOLEAN;
  user2_valid BOOLEAN;
  can_message BOOLEAN;
BEGIN
  -- Validate that one of the users is the current user
  IF auth.uid() != user_a AND auth.uid() != user_b THEN
    RAISE EXCEPTION 'Permission denied: must be one of the conversation participants';
  END IF;
  
  -- Ensure user1_id < user2_id for consistency
  IF user_a < user_b THEN
    smaller_id := user_a;
    larger_id := user_b;
  ELSE
    smaller_id := user_b;
    larger_id := user_a;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM conversations
  WHERE user1_id = smaller_id AND user2_id = larger_id;
  
  -- If conversation exists, return it
  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;
  
  -- Check if both users are valid (completed onboarding, visible profiles)
  SELECT 
    (SELECT onboarding_completed AND profile_visible FROM users WHERE id = smaller_id) AS user1_valid,
    (SELECT onboarding_completed AND profile_visible FROM users WHERE id = larger_id) AS user2_valid
  INTO user1_valid, user2_valid;
  
  IF NOT (user1_valid AND user2_valid) THEN
    RAISE EXCEPTION 'Permission denied: both users must have completed onboarding and visible profiles';
  END IF;
  
  -- Check if users can message each other (same institution OR within 50 miles)
  SELECT EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE 
      u1.id = smaller_id AND u2.id = larger_id
      AND (
        -- Same institution
        (u1.institution_id = u2.institution_id AND u1.institution_id IS NOT NULL)
        OR
        -- Within 50 miles
        (u1.location IS NOT NULL AND u2.location IS NOT NULL 
         AND ST_DWithin(u1.location, u2.location, 80467))
      )
  ) INTO can_message;
  
  IF NOT can_message THEN
    RAISE EXCEPTION 'Permission denied: users must be from the same institution or within 50 miles';
  END IF;
  
  -- Create new conversation (SECURITY DEFINER allows bypassing RLS)
  INSERT INTO conversations (user1_id, user2_id)
  VALUES (smaller_id, larger_id)
  RETURNING id INTO conv_id;
  
  RETURN conv_id;
END;
$$;

-- ===================================
-- FIX 2: Security Definer View (ERROR)
-- ===================================
-- Recreate user_stats view with SECURITY INVOKER (default)
-- This ensures RLS policies are respected

DROP VIEW IF EXISTS user_stats;

CREATE VIEW user_stats 
WITH (security_invoker = true) AS
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

-- Re-grant access to the view
GRANT SELECT ON user_stats TO authenticated;

-- ===================================
-- NOTE: spatial_ref_sys RLS Warning
-- ===================================
-- The spatial_ref_sys table is a PostGIS system table owned by postgres.
-- Supabase does not allow users to modify it, so this warning cannot be 
-- fixed via SQL. However, this is SAFE TO IGNORE because:
-- 1. It only contains public coordinate reference system definitions (EPSG codes)
-- 2. There is no sensitive data in this table
-- 3. It's read-only reference data used by PostGIS functions
-- 
-- Supabase is aware of this and it does not pose a security risk.

-- ===================================
-- NOTES ON REMAINING WARNINGS
-- ===================================

-- EXTENSION IN PUBLIC (pg_trgm, postgis):
-- Moving these extensions to a different schema is risky for a running application
-- as it requires updating all function calls and type casts. This warning is 
-- LOW PRIORITY and safe to ignore for most applications.
-- 
-- If you want to fix this in the future (on a new project), use:
--   CREATE EXTENSION postgis SCHEMA extensions;
--   CREATE EXTENSION pg_trgm SCHEMA extensions;
-- And add 'extensions' to your search_path.

-- LEAKED PASSWORD PROTECTION:
-- This is NOT a SQL fix - enable it in the Supabase Dashboard:
-- Authentication > Settings > Password Requirements > Enable "Leaked password protection"

-- ===================================
-- RELOAD SCHEMA CACHE
-- ===================================
NOTIFY pgrst, 'reload schema';
