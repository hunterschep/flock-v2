-- ===================================
-- MESSAGING SYSTEM SCHEMA
-- ===================================
-- Real-time messaging between users with Supabase Realtime
-- Run this after schema_v3_optimized.sql

-- ===================================
-- CONVERSATIONS TABLE
-- ===================================
-- Stores conversation metadata between two users
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants (always exactly 2 users for 1-on-1 messaging)
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user1_id < user2_id to prevent duplicate conversations
  CHECK (user1_id < user2_id),
  
  -- Unique constraint: only one conversation between two users
  UNIQUE(user1_id, user2_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Composite index for finding conversations by either user
CREATE INDEX idx_conversations_users ON conversations(user1_id, user2_id);

-- ===================================
-- MESSAGES TABLE
-- ===================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Message data
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 10000),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Soft delete (optional - for future "delete for me" feature)
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_receiver BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ===================================
-- HELPER FUNCTIONS
-- ===================================

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

-- Function to update conversation's last_message_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  conv_id UUID,
  reader_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- ===================================
-- TRIGGERS
-- ===================================

-- Update conversation timestamp when new message is sent
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Update updated_at on conversation changes
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on message changes
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can view conversations they're part of
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Conversations: Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Conversations: Users can update their conversations (for timestamp updates)
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- Messages: Users can send messages to their conversations
CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- Messages: Users can update their own messages (for read receipts)
CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- ===================================
-- GRANTS
-- ===================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count(UUID) TO authenticated;

-- Revoke from anon
REVOKE ALL ON conversations FROM anon;
REVOKE ALL ON messages FROM anon;

-- ===================================
-- ENABLE REALTIME
-- ===================================

-- Enable Realtime for messages table (subscribe to new messages)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ===================================
-- RELOAD SCHEMA CACHE
-- ===================================
NOTIFY pgrst, 'reload schema';

