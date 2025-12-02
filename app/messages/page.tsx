'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageView } from '@/components/messaging/MessageView';
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageUtil,
  markMessagesAsRead,
  subscribeToConversation,
  subscribeToAllConversations,
} from '@/lib/messaging/utils';
import type { ConversationWithUser, MessageWithSender } from '@/lib/types/messaging';
import { MessageCircle, ArrowLeft } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (!profile?.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      setCurrentUserId(user.id);
    };

    getCurrentUser();
  }, [router, supabase]);

  // Load conversations
  useEffect(() => {
    if (!currentUserId) return;

    const loadConversations = async () => {
      setLoading(true);
      const convs = await getConversations();
      setConversations(convs);
      setLoading(false);

      // If conversation ID is in URL, auto-select it
      const conversationParam = searchParams.get('conversation');
      if (conversationParam) {
        setSelectedConversationId(conversationParam);
        setShowMobileList(false);
      }
    };

    loadConversations();

    // Subscribe to all conversation updates
    const unsubscribe = subscribeToAllConversations(() => {
      loadConversations();
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserId, searchParams]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !currentUserId) {
      return;
    }

    const loadMessages = async () => {
      setMessagesLoading(true);
      const msgs = await getMessages(selectedConversationId);
      setMessages(msgs);
      setMessagesLoading(false);

      // Mark messages as read
      await markMessagesAsRead(selectedConversationId);
    };

    loadMessages();

    // Subscribe to new messages in this conversation
    const unsubscribe = subscribeToConversation(selectedConversationId, async (newMessage) => {
      // Fetch sender details for the new message
      const { data: sender } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', newMessage.sender_id)
        .single();
      
      const messageWithSender: MessageWithSender = {
        ...newMessage,
        sender: sender || { id: newMessage.sender_id, full_name: 'Unknown', email: '' },
      } as MessageWithSender;
      
      setMessages((prev) => [...prev, messageWithSender]);
      
      // Mark as read if user is viewing this conversation
      if (newMessage.sender_id !== currentUserId) {
        markMessagesAsRead(selectedConversationId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedConversationId, currentUserId, supabase]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowMobileList(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    setSending(true);
    const newMessage = await sendMessageUtil(selectedConversationId, content);
    setSending(false);

    if (newMessage) {
      // Message will be added via realtime subscription
    }
  };

  const handleBack = () => {
    setShowMobileList(true);
    setSelectedConversationId(null);
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  if (!currentUserId) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-mesh overflow-hidden relative">
      {/* Floating background orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000" />

      {/* Header */}
      <header className="glass-header shrink-0 z-20 sticky top-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="glass-light p-2 rounded-lg hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-rose-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">Messages</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 relative z-10 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="glass-strong rounded-3xl overflow-hidden h-full">
            <div className="flex h-full">
              {/* Conversation list - Desktop always visible, mobile conditional */}
              <div
                className={`${
                  showMobileList ? 'flex' : 'hidden'
                } lg:flex lg:w-96 border-r border-white/10 flex-col w-full`}
              >
                <ConversationList
                  conversations={conversations}
                  selectedConversationId={selectedConversationId}
                  onSelectConversation={handleSelectConversation}
                  loading={loading}
                />
              </div>

              {/* Message view - Desktop always visible, mobile conditional */}
              <div
                className={`${
                  !showMobileList ? 'flex' : 'hidden'
                } lg:flex flex-1 flex-col w-full`}
              >
                <MessageView
                  conversation={selectedConversation}
                  messages={messages}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                  onBack={handleBack}
                  loading={messagesLoading}
                  sending={sending}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

