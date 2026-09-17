import { NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/backend";
import { getSessionToken } from "@/lib/session";
import type { StatusResponse, StatusUpdateRequest } from "@/lib/types";

export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as StatusUpdateRequest;

  try {
    const status = await backendFetch<StatusResponse | null>("/status", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    });
    return NextResponse.json(status);
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
