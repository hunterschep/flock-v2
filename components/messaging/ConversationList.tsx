'use client';

import { useState } from 'react';
import { ConversationWithUser } from '@/lib/types/messaging';
import { MessageCircle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: ConversationWithUser[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  loading: boolean;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black/10">
      {/* Search */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <MessageCircle className="w-8 h-8 text-white/20 mb-3" />
            <p className="text-white/50 text-sm mb-1">No conversations</p>
            <p className="text-white/30 text-xs">Start from the dashboard</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full px-3 py-3 text-left transition-all hover:bg-white/[0.03] ${
                  selectedConversationId === conversation.id
                    ? 'bg-[var(--color-accent)]/10 border-l-2 border-[var(--color-accent)]'
                    : 'border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-[var(--color-accent)]">
                      {conversation.other_user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h3 className="font-medium text-white text-sm truncate">
                        {conversation.other_user.full_name}
                      </h3>
                      {conversation.unread_count > 0 && (
                        <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold flex items-center justify-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>

                    {conversation.last_message && (
                      <p className={`text-xs truncate ${
                        conversation.unread_count > 0 ? 'text-white/70' : 'text-white/40'
                      }`}>
                        {conversation.last_message.content}
                      </p>
                    )}

                    <p className="text-xs text-white/30 mt-0.5">
                      {conversation.last_message
                        ? formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })
                        : conversation.other_user.institutions?.name || ''}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
