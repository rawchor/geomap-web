import { NextResponse } from "next/server";
import { backendFetch, BackendError } from "@/lib/backend";
import { setSessionCookie } from "@/lib/session";
import type { AuthResponse, RegisterRequest, SessionUser } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterRequest;

  try {
    const data = await backendFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    await setSessionCookie(data.token);
    const user: SessionUser = {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
    };
    return NextResponse.json(user);
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
