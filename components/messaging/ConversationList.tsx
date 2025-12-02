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
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none text-white placeholder-white/40"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-white/80 font-medium mb-1">No conversations yet</p>
            <p className="text-white/60 text-sm">
              Start a conversation from the dashboard
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full p-4 text-left transition-all hover:bg-white/5 ${
                  selectedConversationId === conversation.id
                    ? 'bg-purple-500/10 border-l-2 border-purple-400'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {conversation.other_user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {conversation.other_user.full_name}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-white/50 whitespace-nowrap">
                          {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-white/60 mb-1">
                      {conversation.other_user.institutions?.name} • Class of{' '}
                      {conversation.other_user.grad_year}
                    </p>

                    {conversation.last_message && (
                      <p
                        className={`text-sm truncate ${
                          conversation.unread_count > 0
                            ? 'text-white font-medium'
                            : 'text-white/70'
                        }`}
                      >
                        {conversation.last_message.content}
                      </p>
                    )}

                    {/* Unread badge */}
                    {conversation.unread_count > 0 && (
                      <div className="mt-2">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                          {conversation.unread_count}
                        </span>
                      </div>
                    )}
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

