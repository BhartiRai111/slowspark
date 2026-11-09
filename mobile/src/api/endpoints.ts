import { api } from './client';
import type {
  AuthResponse, ChatMessage, DateReadyView, Gender, Intent, Interest, InterestedIn, LikeReceived,
  MatchSummary, Me, ProfileCard, ProfileUpdate, Prompt, ReportReason, SwipeResult,
} from './types';

// One function per backend API, grouped by feature.

export const authApi = {
  firebase: (idToken: string) => api<AuthResponse>('/api/auth/firebase', { method: 'POST', body: { idToken } }),
  devLogin: (phone: string) => api<AuthResponse>('/api/auth/dev-login', { method: 'POST', body: { phone } }),
};

export const metaApi = {
  interests: () => api<Interest[]>('/api/meta/interests'),
  prompts: () => api<Prompt[]>('/api/meta/prompts'),
  states: () => api<string[]>('/api/meta/states'),
};

export const meApi = {
  get: () => api<Me>('/api/me'),
  basic: (body: { name: string; dob: string; gender: Gender; interestedIn: InterestedIn; city?: string; state?: string }) =>
    api<void>('/api/me/basic', { method: 'PUT', body }),
  intent: (intent: Intent) => api<void>('/api/me/intent', { method: 'PUT', body: { intent } }),
  profile: (body: ProfileUpdate) => api<void>('/api/me/profile', { method: 'PUT', body }),
  photos: (urls: string[]) => api<void>('/api/me/photos', { method: 'PUT', body: { urls } }),
  location: (body: { latitude: number; longitude: number; city?: string; state?: string }) =>
    api<void>('/api/me/location', { method: 'PUT', body }),
  preferences: (body: { minAge: number; maxAge: number; maxDistanceKm: number; intents: Intent[] }) =>
    api<void>('/api/me/preferences', { method: 'PUT', body }),
  complete: () => api<void>('/api/me/complete', { method: 'POST' }),
  delete: () => api<void>('/api/me', { method: 'DELETE' }),
};

export const discoverApi = {
  feed: () => api<ProfileCard[]>('/api/discover'),
  like: (userId: number, comment?: string) =>
    api<SwipeResult>(`/api/users/${userId}/like`, { method: 'POST', body: { comment: comment ?? null } }),
  pass: (userId: number) => api<void>(`/api/users/${userId}/pass`, { method: 'POST' }),
  profile: (userId: number) => api<ProfileCard>(`/api/users/${userId}`),
  likes: () => api<LikeReceived[]>('/api/likes'),
};

export const matchApi = {
  list: () => api<MatchSummary[]>('/api/matches'),
  unmatch: (matchId: number) => api<void>(`/api/matches/${matchId}/unmatch`, { method: 'POST' }),
  messages: (matchId: number, beforeId?: number) =>
    api<ChatMessage[]>(`/api/matches/${matchId}/messages${beforeId ? `?beforeId=${beforeId}` : ''}`),
  send: (matchId: number, content: string) =>
    api<ChatMessage>(`/api/matches/${matchId}/messages`, { method: 'POST', body: { content } }),
  markRead: (matchId: number) => api<void>(`/api/matches/${matchId}/messages/read`, { method: 'POST' }),
};

export const dateApi = {
  view: (matchId: number) => api<DateReadyView>(`/api/matches/${matchId}/date-ready`),
  choose: (matchId: number, choice: 'YES' | 'NO') =>
    api<DateReadyView>(`/api/matches/${matchId}/date-ready/choice`, { method: 'POST', body: { choice } }),
  form: (matchId: number, likedText: string, questions: string[]) =>
    api<DateReadyView>(`/api/matches/${matchId}/date-ready/form`, { method: 'POST', body: { likedText, questions } }),
  answers: (matchId: number, answers: { questionId: number; answer: string | null; skip: boolean }[]) =>
    api<DateReadyView>(`/api/matches/${matchId}/date-ready/answers`, { method: 'POST', body: { answers } }),
};

export const safetyApi = {
  block: (userId: number) => api<void>(`/api/users/${userId}/block`, { method: 'POST' }),
  report: (userId: number, reason: ReportReason, details?: string) =>
    api<void>(`/api/users/${userId}/report`, { method: 'POST', body: { reason, details: details ?? null } }),
};
