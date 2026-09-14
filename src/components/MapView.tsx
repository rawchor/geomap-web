"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/client-api";
import type { NearbyFriendResponse, SessionUser } from "@/lib/types";
import FriendDetailPanel from "./FriendDetailPanel";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

const POLL_INTERVAL_MS = 15000;
// Used only if the browser has no usable geolocation, so the map still renders.
const FALLBACK_CENTER: [number, number] = [40.7128, -74.006];

type FriendsState = "loading" | "ready" | "error";

export default function MapView({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [friends, setFriends] = useState<NearbyFriendResponse[]>([]);
  const [friendsState, setFriendsState] = useState<FriendsState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<NearbyFriendResponse | null>(null);

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
    };
    // Deferred so the initial fetch runs as an async callback, matching the
    // interval tick below, rather than synchronously during the effect.
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [refreshLocation, loadFriends]);

  const handleRefresh = () => {
    refreshLocation();
    loadFriends();
  };

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  };

  return (
    <div className="fixed inset-0">
      <header className="absolute inset-x-0 top-0 z-[1000] flex items-center justify-between gap-3 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
        <span className="font-medium">Hi, {user.displayName}</span>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="text-sm text-blue-600 hover:underline"
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-zinc-600 hover:underline"
          >
            Log out
          </button>
        </div>
      </header>

      {center ? (
        <LeafletMap
          center={center}
          friends={friends}
          onSelectFriend={setSelected}
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
        <FriendDetailPanel friend={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
