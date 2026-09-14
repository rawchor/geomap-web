export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data.message === "string" && data.message) ||
      res.statusText ||
      "Something went wrong";
    throw new ApiError(res.status, message);
  }

  return data as T;
}
