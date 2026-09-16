"use client";

import { ChevronLeft, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useChat } from "./ChatProvider";

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diffMs = Date.now() - Date.parse(iso);
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ChatWidget({ userId }: { userId: string }) {
  const {
    conversations,
    unreadFriendIds,
    unreadCount,
    activeFriendId,
    messages,
    openThread,
    closeThread,
    sendMessage,
  } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lets other parts of the app (e.g. "Message" in a friend's detail panel)
  // pop the widget open just by calling openThread() on the shared context.
  useEffect(() => {
    if (!activeFriendId) return;
    const id = setTimeout(() => setIsOpen(true), 0);
    return () => clearTimeout(id);
  }, [activeFriendId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, activeFriendId]);

  const activeConversation = conversations.find((c) => c.friendId === activeFriendId);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeFriendId) return;
    sendMessage(activeFriendId, text);
    setDraft("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1200] flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
            {activeFriendId ? (
              <>
                <button
                  onClick={closeThread}
                  aria-label="Back to conversations"
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="flex-1 truncate font-medium">
                  {activeConversation?.displayName ?? "Chat"}
                </span>
              </>
            ) : (
              <span className="flex-1 font-medium">Messages</span>
            )}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X size={18} />
            </button>
          </div>

          {activeFriendId ? (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                {messages.length === 0 && (
                  <p className="mt-8 text-center text-sm text-zinc-400">
                    Say hi 👋
                  </p>
                )}
                {messages.map((m) => {
                  const mine = m.senderId === userId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                          mine ? "bg-black text-white" : "bg-zinc-100 text-zinc-900"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-zinc-100 p-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Message…"
                  className="flex-1 rounded-full border border-zinc-200 px-3 py-1.5 text-sm focus:border-black focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white disabled:opacity-30"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="mt-8 text-center text-sm text-zinc-400">
                  No conversations yet
                </p>
              ) : (
                [...conversations]
                  .sort((a, b) =>
                    (b.lastMessageSentAt ?? "").localeCompare(a.lastMessageSentAt ?? "")
                  )
                  .map((c) => (
                    <button
                      key={c.friendId}
                      onClick={() => openThread(c.friendId)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                    >
                      <Avatar name={c.displayName} photoUrl={c.profilePhotoUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{c.displayName}</span>
                          <span className="shrink-0 text-xs text-zinc-400">
                            {timeAgo(c.lastMessageSentAt)}
                          </span>
                        </div>
                        <p className="truncate text-sm text-zinc-500">
                          {c.lastMessage ?? ""}
                        </p>
                      </div>
                      {unreadFriendIds.has(c.friendId) && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Toggle chat"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-zinc-800"
      >
        <MessageCircle size={22} />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
