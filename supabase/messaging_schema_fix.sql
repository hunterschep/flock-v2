-- ===================================
-- MESSAGING SYSTEM SCHEMA - FIXED VERSION
-- ===================================
-- This version fixes RLS permission issues
-- Run this AFTER the initial messaging_schema.sql

-- Drop existing function and recreate with better permission handling
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID);

-- Function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user_a UUID,
  user_b UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Update the RLS policy for conversations to be simpler since SECURITY DEFINER handles validation
-- Drop the old policies
DROP POLICY IF EXISTS "Users can create conversations with classmates" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- Create simpler policies - the function handles validation
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Update grants to include UPDATE on conversations (needed for timestamp trigger)
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;

-- Also grant execute on other functions
GRANT EXECUTE ON FUNCTION mark_messages_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count(UUID) TO authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

