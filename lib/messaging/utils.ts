import { createClient } from '@/lib/supabase/client';
import type { ConversationWithUser, Message, MessageWithSender } from '@/lib/types/messaging';

/**
 * Get or create a conversation between current user and another user
 */
export async function getOrCreateConversation(otherUserId: string): Promise<string | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    user_a: user.id,
    user_b: otherUserId,
  });
  
  if (error) {
    console.error('Error getting/creating conversation:', error);
    return null;
  }
  
  return data;
}

/**
 * Get all conversations for the current user with user details
 */
export async function getConversations(): Promise<ConversationWithUser[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  // Get conversations
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });
  
  if (convError || !conversations) {
    console.error('Error fetching conversations:', convError);
    return [];
  }
  
  // Fetch other user details and last messages
  const conversationsWithDetails = await Promise.all(
    conversations.map(async (conv) => {
      const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
      
      // Get other user details
      const { data: otherUser } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          grad_year,
          city,
          state,
          employer,
          job_title,
          institutions:institution_id (
            name,
            domain
          )
        `)
        .eq('id', otherUserId)
        .single();
      
      // Get last message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // Get unread count
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', false)
        .neq('sender_id', user.id);
      
      return {
        id: conv.id,
        other_user: otherUser as ConversationWithUser['other_user'],
        last_message: lastMessage as Message | null,
        unread_count: unreadCount || 0,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
      };
    })
  );
  
  return conversationsWithDetails;
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<MessageWithSender[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id (
        id,
        full_name,
        email
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data as unknown as MessageWithSender[];
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<Message | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error sending message:', error);
    return null;
  }
  
  return data as Message;
}

/**
 * Mark messages as read in a conversation
 */
export async function markMessagesAsRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const { error } = await supabase.rpc('mark_messages_read', {
    conv_id: conversationId,
    reader_id: user.id,
  });
  
  if (error) {
    console.error('Error marking messages as read:', error);
  }
}

/**
 * Get total unread message count for current user
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  
  const { data, error } = await supabase.rpc('get_unread_count', {
    user_uuid: user.id,
  });
  
  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
  
  return data || 0;
}

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: Message) => void
) {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to all conversations for current user
 */
export function subscribeToAllConversations(
  onUpdate: () => void
) {
  const supabase = createClient();
  
  const channel = supabase
    .channel('all-conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

