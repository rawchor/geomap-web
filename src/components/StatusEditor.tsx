"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import type {
  StatusPresetOptionResponse,
  StatusResponse,
  StatusUpdateRequest,
} from "@/lib/types";

const CUSTOM_TEXT_MAX = 30;

const DURATIONS: { label: string; minutes: number | null }[] = [
  { label: "1 hour", minutes: 60 },
  { label: "4 hours", minutes: 240 },
  { label: "Until I change it", minutes: null },
];

export default function StatusEditor({
  currentStatus,
  onClose,
  onSaved,
}: {
  currentStatus: StatusResponse | null;
  onClose: () => void;
  onSaved: (status: StatusResponse | null) => void;
}) {
  const [presets, setPresets] = useState<StatusPresetOptionResponse[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    currentStatus?.presetOptionId ?? null
  );
  const [customText, setCustomText] = useState(
    currentStatus?.presetOptionId ? "" : currentStatus?.customText ?? ""
  );
  const [durationMinutes, setDurationMinutes] = useState<number | null>(60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<StatusPresetOptionResponse[]>("/api/status/presets")
      .then(setPresets)
      .catch(() => setError("Couldn't load status options"))
      .finally(() => setLoadingPresets(false));
  }, []);

  const filteredPresets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter((p) => p.label.toLowerCase().includes(q));
  }, [presets, search]);

  const hasSelection = Boolean(selectedPresetId || customText.trim());

  const handleSelectPreset = (preset: StatusPresetOptionResponse) => {
    setSelectedPresetId(preset.id);
    setCustomText("");
  };

  const handleCustomTextChange = (value: string) => {
    setCustomText(value.slice(0, CUSTOM_TEXT_MAX));
    setSelectedPresetId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const body: StatusUpdateRequest = {
      presetOptionId: selectedPresetId || null,
      customText: selectedPresetId ? null : customText.trim() || null,
      durationMinutes,
    };
    try {
      const status = await apiFetch<StatusResponse | null>("/api/status", {
        method: "POST",
        body: JSON.stringify(body),
      });
      onSaved(status);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your status");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch<StatusResponse | null>("/api/status", {
        method: "POST",
        body: JSON.stringify({ presetOptionId: null, customText: null, durationMinutes: null }),
      });
      onSaved(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't clear your status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1150] flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-sm flex-col rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My status</h2>
          <button onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-zinc-600">
            <X size={18} />
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search presets…"
          className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
        />

        <div className="mt-2 max-h-40 flex-1 overflow-y-auto rounded-lg border border-zinc-100">
          {loadingPresets ? (
            <p className="p-3 text-sm text-zinc-400">Loading…</p>
          ) : filteredPresets.length === 0 ? (
            <p className="p-3 text-sm text-zinc-400">No matching presets</p>
          ) : (
            filteredPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 ${
                  selectedPresetId === preset.id ? "bg-blue-50" : ""
                }`}
              >
                <span>{preset.emoji}</span>
                <span>{preset.label}</span>
              </button>
            ))
          )}
        </div>

        <div className="mt-3">
          <input
            value={customText}
            onChange={(e) => handleCustomTextChange(e.target.value)}
            placeholder="Or write your own…"
            maxLength={CUSTOM_TEXT_MAX}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-zinc-400">
            {customText.length}/{CUSTOM_TEXT_MAX}
          </p>
        </div>

        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-zinc-500">Clears after</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.label}
                onClick={() => setDurationMinutes(d.minutes)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  durationMinutes === d.minutes
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          {currentStatus && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Clear status
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasSelection}
            className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
