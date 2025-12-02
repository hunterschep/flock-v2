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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black/20">
      {/* Search - Compact */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none text-white placeholder-white/40"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <MessageCircle className="w-8 h-8 text-white/30 mb-3" />
            <p className="text-white/60 text-sm mb-1">No conversations</p>
            <p className="text-white/40 text-xs">Start from the dashboard</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full px-3 py-3 text-left transition-all hover:bg-white/5 ${
                  selectedConversationId === conversation.id
                    ? 'bg-rose-500/10 border-l-2 border-rose-400'
                    : 'border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar - Compact */}
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
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
                        <span className="shrink-0 w-5 h-5 rounded-full bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>

                    {conversation.last_message && (
                      <p className={`text-xs truncate ${
                        conversation.unread_count > 0 ? 'text-white/80' : 'text-white/50'
                      }`}>
                        {conversation.last_message.content}
                      </p>
                    )}

                    <p className="text-xs text-white/40 mt-0.5">
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

