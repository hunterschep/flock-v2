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

    const unsubscribe = subscribeToAllConversations(() => {
      loadUnreadCount();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-[var(--color-accent)] rounded-full min-w-[18px]">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
