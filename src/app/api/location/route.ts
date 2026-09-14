import { NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/backend";
import { getSessionToken } from "@/lib/session";
import type { LocationResponse, LocationUpdateRequest } from "@/lib/types";

export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as LocationUpdateRequest;

  try {
    const location = await backendFetch<LocationResponse>("/location", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    });
    return NextResponse.json(location);
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
