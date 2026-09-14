"use client";

/* eslint-disable @next/next/no-img-element */

import type { NearbyFriendResponse, StatusPreset } from "@/lib/types";

const STATUS_LABELS: Record<StatusPreset, string> = {
  FREE_TO_HANG: "Free to hang",
  GRABBING_COFFEE: "Grabbing coffee",
  BUSY: "Busy",
  OUT_AND_ABOUT: "Out and about",
};

export default function FriendDetailPanel({
  friend,
  onClose,
}: {
  friend: NearbyFriendResponse;
  onClose: () => void;
}) {
  const statusText = friend.status
    ? friend.status.customText ||
      (friend.status.preset ? STATUS_LABELS[friend.status.preset] : null)
    : null;

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
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
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
      </div>
    </div>
  );
}
