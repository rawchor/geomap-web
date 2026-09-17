import type { StatusResponse } from "./types";

export function formatStatusLabel(status?: StatusResponse | null): string | null {
  if (!status) return null;
  if (status.customText) return status.customText;
  if (status.presetLabel) {
    return status.presetEmoji ? `${status.presetEmoji} ${status.presetLabel}` : status.presetLabel;
  }
  return null;
}
