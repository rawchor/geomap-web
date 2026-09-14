export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  displayName: string;
}

export type SessionUser = Omit<AuthResponse, "token">;

export type FriendDegree = "FIRST_DEGREE" | "SECOND_DEGREE";

export type StatusPreset =
  | "FREE_TO_HANG"
  | "GRABBING_COFFEE"
  | "BUSY"
  | "OUT_AND_ABOUT";

export interface StatusResponse {
  preset?: StatusPreset;
  customText?: string;
}

export interface NearbyFriendResponse {
  userId: string;
  displayName: string;
  profilePhotoUrl?: string;
  latitude: number;
  longitude: number;
  degree: FriendDegree;
  mutualFriendName?: string;
  status?: StatusResponse | null;
}

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
}

export interface LocationResponse {
  userId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}
