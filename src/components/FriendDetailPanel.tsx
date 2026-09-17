"use client";

/* eslint-disable @next/next/no-img-element */

import { formatStatusLabel } from "@/lib/status";
import type { NearbyFriendResponse } from "@/lib/types";

export default function FriendDetailPanel({
  friend,
  onClose,
  onMessage,
}: {
  friend: NearbyFriendResponse;
  onClose: () => void;
  onMessage: (friend: NearbyFriendResponse) => void;
}) {
  const statusText = formatStatusLabel(friend.status);

  const connectionContext =
    friend.degree === "FIRST_DEGREE"
      ? "Direct friend"
      : friend.mutualFriendName
        ? `Friends with ${friend.mutualFriendName}`
        : "Friend of a friend";

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 text-zinc-900 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {friend.profilePhotoUrl ? (
              <img
                src={friend.profilePhotoUrl}
                alt={friend.displayName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-lg font-semibold text-zinc-600">
                {friend.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{friend.displayName}</p>
              <p className="text-sm text-zinc-500">{connectionContext}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          {statusText ? (
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
              {statusText}
            </span>
          ) : (
            <p className="text-sm text-zinc-400">No status set</p>
          )}
        </div>

        <button
          onClick={() => onMessage(friend)}
          className="mt-5 w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Message
        </button>
      </div>
    </div>
  );
}
