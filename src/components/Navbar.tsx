"use client";

import { ChevronDown, LogOut, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import type { SessionUser } from "@/lib/types";

export default function Navbar({
  user,
  onRefresh,
  onLogout,
}: {
  user: SessionUser;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPremium = user.subscriptionTier === "PREMIUM";

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] flex items-center justify-between border-b border-zinc-200/70 bg-white/85 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900">
        <MapPin size={20} className="text-black" strokeWidth={2.5} />
        <span>Geomap</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isPremium && (
          <span className="hidden items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 sm:inline-flex">
            <Sparkles size={12} />
            Premium
          </span>
        )}

        <button
          onClick={onRefresh}
          title="Refresh"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <RefreshCw size={16} />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-zinc-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-sm font-medium text-zinc-700 sm:inline">
              {user.displayName}
            </span>
            <ChevronDown size={14} className="text-zinc-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-[999]"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-[1001] mt-2 w-52 overflow-hidden rounded-xl bg-white py-1 text-zinc-900 shadow-lg ring-1 ring-black/5">
                <div className="border-b border-zinc-100 px-3 py-2">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {user.displayName}
                  </p>
                  <p className="truncate text-xs text-zinc-400">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-zinc-50"
                >
                  <LogOut size={14} />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
