import { NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/backend";
import { getSessionToken } from "@/lib/session";
import type { ChatMessageResponse } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ friendId: string }> }
) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { friendId } = await params;
  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();
  const before = searchParams.get("before");
  const limit = searchParams.get("limit");
  if (before) query.set("before", before);
  if (limit) query.set("limit", limit);
  const qs = query.toString();

  try {
    const messages = await backendFetch<ChatMessageResponse[]>(
      `/chat/${friendId}/messages${qs ? `?${qs}` : ""}`,
      { token }
    );
    return NextResponse.json(messages);
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
