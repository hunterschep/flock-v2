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
import { Footer } from '@/components/Footer';

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

  useEffect(() => {
    if (!currentUserId) return;

    const loadConversations = async () => {
      setLoading(true);
      const convs = await getConversations();
      setConversations(convs);
      setLoading(false);

      const conversationParam = searchParams.get('conversation');
      if (conversationParam) {
        setSelectedConversationId(conversationParam);
        setShowMobileList(false);
      }
    };

    loadConversations();

    const unsubscribe = subscribeToAllConversations(async () => {
      const convs = await getConversations();
      setConversations((prev) => {
        const hasNewContent = convs.some((newConv) => {
          const oldConv = prev.find((p) => p.id === newConv.id);
          if (!oldConv) return true;
          return (
            newConv.unread_count !== oldConv.unread_count ||
            newConv.last_message?.id !== oldConv.last_message?.id
          );
        });
        return hasNewContent ? convs : prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserId, searchParams]);

  useEffect(() => {
    if (!selectedConversationId || !currentUserId) {
      return;
    }

    const loadMessages = async () => {
      setMessagesLoading(true);
      const msgs = await getMessages(selectedConversationId);
      setMessages(msgs);
      setMessagesLoading(false);
      await markMessagesAsRead(selectedConversationId);
    };

    loadMessages();

    const unsubscribe = subscribeToConversation(selectedConversationId, async (newMessage) => {
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
    if (!selectedConversationId || !currentUserId) return;

    setSending(true);
    
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === selectedConversationId
          ? {
              ...conv,
              last_message: {
                id: 'temp-' + Date.now(),
                conversation_id: selectedConversationId,
                sender_id: currentUserId,
                content: content.trim(),
                created_at: new Date().toISOString(),
                is_read: false,
              },
              last_message_at: new Date().toISOString(),
            }
          : conv
      ).sort((a, b) => 
        new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
      )
    );
    
    await sendMessageUtil(selectedConversationId, content);
    setSending(false);
  };

  const handleBack = () => {
    setShowMobileList(true);
    setSelectedConversationId(null);
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Header */}
      <header className="glass-header shrink-0 z-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h1 className="text-lg font-semibold text-white">Messages</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 relative z-10 overflow-hidden">
        <div className="h-[calc(100vh-180px)] max-w-6xl mx-auto px-4 md:px-6 py-6">
          <div className="glass-card rounded-xl overflow-hidden h-full">
            <div className="flex h-full">
              {/* Conversation list */}
              <div
                className={`${
                  showMobileList ? 'flex' : 'hidden'
                } lg:flex lg:w-80 border-r border-white/[0.06] flex-col w-full`}
              >
                <ConversationList
                  conversations={conversations}
                  selectedConversationId={selectedConversationId}
                  onSelectConversation={handleSelectConversation}
                  loading={loading}
                />
              </div>

              {/* Message view */}
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

      <Footer />
    </div>
  );
}
