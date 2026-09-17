export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export type SubscriptionTier = "FREE" | "PREMIUM";

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  subscriptionTier?: SubscriptionTier;
}

export type SessionUser = Omit<AuthResponse, "token">;

export type FriendDegree = "FIRST_DEGREE" | "SECOND_DEGREE";

export interface StatusResponse {
  presetOptionId?: string;
  presetLabel?: string;
  presetEmoji?: string;
  customText?: string;
}

export interface StatusPresetOptionResponse {
  id: string;
  label: string;
  emoji: string;
}

export interface StatusUpdateRequest {
  presetOptionId?: string | null;
  customText?: string | null;
  durationMinutes?: number | null;
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
  locked?: boolean;
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

export interface ChatMessageResponse {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  sentAt: string;
  readAt?: string | null;
}

export interface ConversationResponse {
  friendId: string;
  displayName: string;
  profilePhotoUrl?: string;
  lastMessage?: string;
  lastMessageSentAt?: string;
}

export type ChatSocketMessage =
  | { type: "message"; recipientId: string; content: string }
  | {
      type: "message";
      id: string;
      senderId: string;
      recipientId: string;
      content: string;
      sentAt: string;
      readAt?: string | null;
    }
  | { type: "error"; message: string };
