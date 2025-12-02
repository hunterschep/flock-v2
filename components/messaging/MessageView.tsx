'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageWithSender, ConversationWithUser } from '@/lib/types/messaging';
import { Send, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface MessageViewProps {
  conversation: ConversationWithUser | null;
  messages: MessageWithSender[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  sending: boolean;
}

export function MessageView({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  loading,
  sending,
}: MessageViewProps) {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation) {
      inputRef.current?.focus();
    }
  }, [conversation]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = messageInput.trim();
    if (!content || sending) return;

    setMessageInput('');
    await onSendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const groupMessagesByDate = (msgs: MessageWithSender[]) => {
    const groups: { date: string; messages: MessageWithSender[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
      
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 mx-auto">
            <Send className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-white/80 font-medium">Select a conversation</p>
          <p className="text-white/60 text-sm mt-1">Choose a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-header p-4 border-b border-white/10 flex items-center gap-3">
        <button
          onClick={onBack}
          className="lg:hidden glass-light p-2 rounded-lg hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
          <span className="text-lg font-bold text-white">
            {conversation.other_user.full_name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white truncate">{conversation.other_user.full_name}</h2>
          <p className="text-xs text-white/60 truncate">
            {conversation.other_user.institutions?.name}
            {conversation.other_user.city && conversation.other_user.state && (
              <> • {conversation.other_user.city}, {conversation.other_user.state}</>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400" />
          </div>
        ) : messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white/60 text-sm">No messages yet</p>
              <p className="text-white/40 text-xs mt-1">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center justify-center my-6">
                <div className="glass-light px-3 py-1 rounded-full text-xs text-white/70">
                  {isToday(new Date(group.date))
                    ? 'Today'
                    : isYesterday(new Date(group.date))
                    ? 'Yesterday'
                    : format(new Date(group.date), 'MMMM d, yyyy')}
                </div>
              </div>

              {/* Messages for this date */}
              {group.messages.map((message) => {
                const isOwn = message.sender_id === currentUserId;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwn && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {message.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}

                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'glass-button text-white'
                            : 'glass-card text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <span className="text-xs text-white/40 mt-1 px-1">
                        {formatMessageTime(new Date(message.created_at))}
                        {isOwn && message.is_read && ' • Read'}
                      </span>
                    </div>

                    {isOwn && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {message.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="glass-input flex-1 px-4 py-3 rounded-xl resize-none focus:outline-none text-white placeholder-white/40 text-sm"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || sending}
            className="glass-button px-4 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-white/40 mt-2">Press Enter to send, Shift+Enter for new line</p>
      </form>
    </div>
  );
}

