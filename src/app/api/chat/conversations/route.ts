import { NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/backend";
import { getSessionToken } from "@/lib/session";
import type { ConversationResponse } from "@/lib/types";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const conversations = await backendFetch<ConversationResponse[]>(
      "/chat/conversations",
      { token }
    );
    return NextResponse.json(conversations);
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
