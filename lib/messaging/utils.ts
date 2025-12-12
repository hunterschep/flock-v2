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
 * Optimized to avoid N+1 queries - uses batch fetching
 */
export async function getConversations(): Promise<ConversationWithUser[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  // Get conversations with a single query
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });
  
  if (convError || !conversations || conversations.length === 0) {
    if (convError) console.error('Error fetching conversations:', convError);
    return [];
  }
  
  // Extract all other user IDs and conversation IDs in one pass
  const otherUserIds = conversations.map(conv => 
    conv.user1_id === user.id ? conv.user2_id : conv.user1_id
  );
  const conversationIds = conversations.map(conv => conv.id);
  
  // Batch fetch all other users in ONE query
  const { data: otherUsers } = await supabase
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
    .in('id', otherUserIds);
  
  // Create lookup map for O(1) access
  const userMap = new Map((otherUsers || []).map(u => [u.id, u]));
  
  // Batch fetch last messages for all conversations
  // Using a raw query approach to get latest message per conversation efficiently
  const { data: lastMessages } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false });
  
  // Group messages by conversation and take first (latest) for each
  const lastMessageMap = new Map<string, Message>();
  (lastMessages || []).forEach(msg => {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, msg as Message);
    }
  });
  
  // Batch fetch unread counts - get all unread messages and count per conversation
  const { data: unreadMessages } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', conversationIds)
    .eq('is_read', false)
    .neq('sender_id', user.id);
  
  // Count unread per conversation
  const unreadCountMap = new Map<string, number>();
  (unreadMessages || []).forEach(msg => {
    unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) || 0) + 1);
  });
  
  // Assemble final result (no async needed - all data fetched)
  return conversations.map(conv => {
    const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    
    return {
      id: conv.id,
      other_user: userMap.get(otherUserId) as ConversationWithUser['other_user'],
      last_message: lastMessageMap.get(conv.id) || null,
      unread_count: unreadCountMap.get(conv.id) || 0,
      last_message_at: conv.last_message_at,
      created_at: conv.created_at,
    };
  });
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

