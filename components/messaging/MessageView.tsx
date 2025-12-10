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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
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
      <div className="h-full flex items-center justify-center bg-black/5">
        <div className="text-center">
          <Send className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">Select a conversation</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-full flex flex-col bg-black/5">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3 bg-black/10">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>

        <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-[var(--color-accent)]">
            {conversation.other_user.full_name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-white text-sm truncate">{conversation.other_user.full_name}</h2>
          <p className="text-xs text-white/40 truncate">
            {conversation.other_user.city && conversation.other_user.state 
              ? `${conversation.other_user.city}, ${conversation.other_user.state}`
              : conversation.other_user.institutions?.name || ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin" />
          </div>
        ) : messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white/50 text-sm">No messages yet</p>
              <p className="text-white/30 text-xs mt-1">Send a message to start</p>
            </div>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center justify-center my-6">
                <div className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.06] text-xs text-white/50">
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
                    className={`flex gap-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwn && (
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center">
                        <span className="text-xs font-medium text-white/60">
                          {message.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}

                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      <div
                        className={`rounded-xl px-3 py-2 ${
                          isOwn
                            ? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 text-white'
                            : 'bg-white/[0.03] border border-white/[0.06] text-white/90'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <span className="text-xs text-white/30 mt-0.5 px-1">
                        {formatMessageTime(new Date(message.created_at))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/[0.06] bg-black/10">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="glass-input flex-1 px-3 py-2.5 rounded-xl resize-none text-sm"
            style={{ minHeight: '40px', maxHeight: '100px' }}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || sending}
            className="glass-button px-3 py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
