// Messaging system types for Supabase

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_by_sender: boolean;
  deleted_by_receiver: boolean;
}

// Extended conversation with user details
export interface ConversationWithUser {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    email: string;
    grad_year: number;
    city: string | null;
    state: string | null;
    employer: string | null;
    job_title: string | null;
    institutions: {
      name: string;
      domain: string;
    } | null;
  };
  last_message: Message | null;
  unread_count: number;
  last_message_at: string;
  created_at: string;
}

// Message with sender details
export interface MessageWithSender {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender: {
    id: string;
    full_name: string;
    email: string;
  };
}

