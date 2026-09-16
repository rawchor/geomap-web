import { NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/backend";
import { getSessionToken } from "@/lib/session";
import type { StatusPresetOptionResponse } from "@/lib/types";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const presets = await backendFetch<StatusPresetOptionResponse[]>(
      "/status/presets",
      { token }
    );
    return NextResponse.json(presets);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { message: "Unable to reach the server" },
      { status: 502 }
    );
  }
}
