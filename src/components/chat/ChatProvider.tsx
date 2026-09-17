"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { apiFetch } from "@/lib/client-api";
import type { ChatMessageResponse, ConversationResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 15000;
// How long after we send a message do we treat that friend's conversation
// row as "just us talking", not a new unread from them (REST /chat/conversations
// has no senderId, so we can't otherwise tell who sent the last message).
const SELF_SEND_TOLERANCE_MS = 12000;

// Plain helper (not a hook), so it's fine for it to read the wall clock —
// it's only ever invoked from effects/event handlers below, never render.
function computeUnread(
  conversations: ConversationResponse[],
  lastRead: Record<string, string>,
  recentlySentTo: Record<string, number>
): Set<string> {
  const now = Date.now();
  const unread = new Set<string>();
  for (const c of conversations) {
    if (!c.lastMessageSentAt) continue;
    const sentAt = c.lastMessageSentAt;
    if (Number.isNaN(Date.parse(sentAt))) continue;
    const sentTimestamp = recentlySentTo[c.friendId] ?? 0;
    const sentByMeRecently = sentTimestamp > 0 && now - sentTimestamp < SELF_SEND_TOLERANCE_MS;
    const read = lastRead[c.friendId] !== undefined && lastRead[c.friendId] >= sentAt;
    if (!read && !sentByMeRecently) {
      unread.add(c.friendId);
    }
  }
  return unread;
}

function lastReadStorageKey(userId: string) {
  return `geomap:chat:lastRead:${userId}`;
}

function loadLastRead(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(lastReadStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLastRead(userId: string, data: Record<string, string>) {
  try {
    localStorage.setItem(lastReadStorageKey(userId), JSON.stringify(data));
  } catch {
    // best-effort
  }
}

interface ChatContextValue {
  conversations: ConversationResponse[];
  unreadFriendIds: Set<string>;
  unreadCount: number;
  activeFriendId: string | null;
  messages: ChatMessageResponse[];
  connected: boolean;
  openThread: (friendId: string, displayName?: string, profilePhotoUrl?: string) => void;
  closeThread: () => void;
  sendMessage: (recipientId: string, content: string) => void;
  refreshConversations: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [messagesByFriend, setMessagesByFriend] = useState<
    Record<string, ChatMessageResponse[]>
  >({});
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastRead, setLastRead] = useState<Record<string, string>>(() =>
    loadLastRead(userId)
  );
  const [recentlySentTo, setRecentlySentTo] = useState<Record<string, number>>({});
  const [unreadFriendIds, setUnreadFriendIds] = useState<Set<string>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);
  const activeFriendRef = useRef<string | null>(null);
  useEffect(() => {
    activeFriendRef.current = activeFriendId;
  }, [activeFriendId]);

  const updateLastRead = useCallback(
    (friendId: string, iso: string) => {
      setLastRead((prev) => {
        if (prev[friendId] && prev[friendId] >= iso) return prev;
        const next = { ...prev, [friendId]: iso };
        saveLastRead(userId, next);
        return next;
      });
    },
    [userId]
  );

  const refreshConversations = useCallback(async () => {
    try {
      const data = await apiFetch<ConversationResponse[]>("/api/chat/conversations");
      setConversations(data);
    } catch {
      // transient failures are fine; the next poll will retry
    }
  }, []);

  useEffect(() => {
    // Deferred so the initial fetch runs as an async callback, matching the
    // interval tick below, rather than synchronously during the effect.
    const initial = setTimeout(refreshConversations, 0);
    const interval = setInterval(refreshConversations, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [refreshConversations]);

  useEffect(() => {
    const id = setTimeout(() => {
      setUnreadFriendIds(computeUnread(conversations, lastRead, recentlySentTo));
    }, 0);
    return () => clearTimeout(id);
  }, [conversations, lastRead, recentlySentTo]);

  const appendMessage = useCallback(
    (friendId: string, message: ChatMessageResponse) => {
      setMessagesByFriend((prev) => {
        const existing = prev[friendId] ?? [];
        if (existing.some((m) => m.id === message.id)) return prev;
        return { ...prev, [friendId]: [...existing, message] };
      });
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        let data: unknown;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (
          typeof data !== "object" ||
          data === null ||
          !("type" in data) ||
          (data as { type: unknown }).type !== "message" ||
          !("senderId" in data)
        ) {
          return;
        }
        const message = data as unknown as ChatMessageResponse;
        appendMessage(message.senderId, message);
        if (activeFriendRef.current === message.senderId) {
          updateLastRead(message.senderId, message.sentAt);
        }
        refreshConversations();
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) retryTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, [appendMessage, refreshConversations, updateLastRead]);

  const openThread = useCallback(
    async (friendId: string, displayName?: string, profilePhotoUrl?: string) => {
      setActiveFriendId(friendId);
      updateLastRead(friendId, new Date().toISOString());
      if (displayName) {
        setConversations((prev) =>
          prev.some((c) => c.friendId === friendId)
            ? prev
            : [...prev, { friendId, displayName, profilePhotoUrl }]
        );
      }
      if (!messagesByFriend[friendId]) {
        try {
          const history = await apiFetch<ChatMessageResponse[]>(
            `/api/chat/${friendId}/messages`
          );
          setMessagesByFriend((prev) => ({ ...prev, [friendId]: history }));
        } catch {
          setMessagesByFriend((prev) => ({ ...prev, [friendId]: prev[friendId] ?? [] }));
        }
      }
    },
    [messagesByFriend, updateLastRead]
  );

  const closeThread = useCallback(() => setActiveFriendId(null), []);

  const sendMessage = useCallback(
    (recipientId: string, content: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const optimistic: ChatMessageResponse = {
        id: `local-${crypto.randomUUID()}`,
        senderId: userId,
        recipientId,
        content,
        sentAt: new Date().toISOString(),
        readAt: null,
      };
      appendMessage(recipientId, optimistic);
      setRecentlySentTo((prev) => ({ ...prev, [recipientId]: Date.now() }));
      updateLastRead(recipientId, optimistic.sentAt);

      ws.send(JSON.stringify({ type: "message", recipientId, content }));
    },
    [appendMessage, updateLastRead, userId]
  );

  const value: ChatContextValue = {
    conversations,
    unreadFriendIds,
    unreadCount: unreadFriendIds.size,
    activeFriendId,
    messages: activeFriendId ? messagesByFriend[activeFriendId] ?? [] : [],
    connected,
    openThread,
    closeThread,
    sendMessage,
    refreshConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
