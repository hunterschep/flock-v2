'use client';

import { useState, useEffect } from 'react';
import { getUnreadCount, subscribeToAllConversations } from '@/lib/messaging/utils';

export function UnreadBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    };

    loadUnreadCount();

    // Subscribe to conversation updates to refresh unread count
    const unsubscribe = subscribeToAllConversations(() => {
      loadUnreadCount();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-br from-purple-500 to-pink-500 rounded-full min-w-[20px]">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}

