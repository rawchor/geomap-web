"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/client-api";
import { formatStatusLabel } from "@/lib/status";
import type { NearbyFriendResponse, SessionUser, StatusResponse } from "@/lib/types";
import ChatWidget from "./chat/ChatWidget";
import { ChatProvider, useChat } from "./chat/ChatProvider";
import FriendDetailPanel from "./FriendDetailPanel";
import Navbar from "./Navbar";
import StatusEditor from "./StatusEditor";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

const POLL_INTERVAL_MS = 15000;
// Used only if the browser has no usable geolocation, so the map still renders.
const FALLBACK_CENTER: [number, number] = [40.7128, -74.006];

type FriendsState = "loading" | "ready" | "error";

export default function MapView({ user }: { user: SessionUser }) {
  return (
    <ChatProvider userId={user.userId}>
      <MapViewInner user={user} />
      <ChatWidget userId={user.userId} />
    </ChatProvider>
  );
}

function MapViewInner({ user }: { user: SessionUser }) {
  const router = useRouter();
  const chat = useChat();
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [friends, setFriends] = useState<NearbyFriendResponse[]>([]);
  const [friendsState, setFriendsState] = useState<FriendsState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<NearbyFriendResponse | null>(null);
  const [myStatus, setMyStatus] = useState<StatusResponse | null>(null);
  const [showStatusEditor, setShowStatusEditor] = useState(false);

  const postLocation = useCallback((latitude: number, longitude: number) => {
    apiFetch("/api/location", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    }).catch(() => {
      // best-effort; the friends poll surfaces connectivity problems
    });
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const data = await apiFetch<NearbyFriendResponse[]>("/api/friends/nearby");
      setFriends(data);
      setFriendsState("ready");
      setErrorMessage(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setFriendsState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to load friends");
    }
  }, [router]);

  const loadMyStatus = useCallback(async () => {
    try {
      const status = await apiFetch<StatusResponse | null>("/api/status/me");
      setMyStatus(status);
    } catch {
      // non-critical; the map still works without it
    }
  }, []);

  const refreshLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setCenter((prev) => prev ?? FALLBACK_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter([latitude, longitude]);
        postLocation(latitude, longitude);
      },
      () => {
        setCenter((prev) => prev ?? FALLBACK_CENTER);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [postLocation]);

  useEffect(() => {
    const tick = () => {
      refreshLocation();
      loadFriends();
      loadMyStatus();
    };
    // Deferred so the initial fetch runs as an async callback, matching the
    // interval tick below, rather than synchronously during the effect.
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [refreshLocation, loadFriends, loadMyStatus]);

  const handleRefresh = () => {
    refreshLocation();
    loadFriends();
    loadMyStatus();
    chat.refreshConversations();
  };

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  };

  const handleMessage = (friend: NearbyFriendResponse) => {
    setSelected(null);
    chat.openThread(friend.userId, friend.displayName, friend.profilePhotoUrl);
  };

  return (
    <div className="fixed inset-0">
      <Navbar user={user} onRefresh={handleRefresh} onLogout={handleLogout} />

      {center ? (
        <LeafletMap
          center={center}
          friends={friends}
          onSelectFriend={setSelected}
          ownStatusLabel={formatStatusLabel(myStatus)}
          onSelectOwn={() => setShowStatusEditor(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-zinc-500">
          Locating you…
        </div>
      )}

      {center && friendsState === "loading" && (
        <div className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm shadow">
          Loading friends…
        </div>
      )}

      {friendsState === "error" && (
        <div className="absolute bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-4 py-2 text-sm shadow">
          <span className="text-red-600">{errorMessage}</span>
          <button onClick={loadFriends} className="text-blue-600 hover:underline">
            Retry
          </button>
        </div>
      )}

      {friendsState === "ready" && friends.length === 0 && (
        <div className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm shadow">
          No friends nearby yet
        </div>
      )}

      {selected && (
        <FriendDetailPanel
          friend={selected}
          onClose={() => setSelected(null)}
          onMessage={handleMessage}
        />
      )}

      {showStatusEditor && (
        <StatusEditor
          currentStatus={myStatus}
          onClose={() => setShowStatusEditor(false)}
          onSaved={setMyStatus}
        />
      )}
    </div>
  );
}
