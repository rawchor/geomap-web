const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class BackendError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
  } catch {
    // response had no JSON body
  }
  return res.statusText || "Request failed";
}

export async function backendFetch<T>(
  path: string,
  init?: RequestInit & { token?: string | null }
): Promise<T> {
  const { token, headers, ...rest } = init ?? {};
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new BackendError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) {
    return null as T;
  }

  // Some endpoints (e.g. /status/me, POST /status with no status set) send
  // Content-Length: 0 with a 200 instead of a 204 or `{}` body.
  const text = await res.text();
  if (!text) {
    return null as T;
  }
  return JSON.parse(text) as T;
}
