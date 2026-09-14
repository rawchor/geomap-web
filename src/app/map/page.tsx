import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { clearSessionCookie, getSessionToken } from "@/lib/session";
import type { AuthResponse, SessionUser } from "@/lib/types";
import MapView from "@/components/MapView";

export default async function MapPage() {
  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  let auth: AuthResponse;
  try {
    auth = await backendFetch<AuthResponse>("/auth/me", { token });
  } catch {
    await clearSessionCookie();
    redirect("/login");
  }

  const user: SessionUser = {
    userId: auth.userId,
    email: auth.email,
    displayName: auth.displayName,
  };

  return <MapView user={user} />;
}
