// TypeScript shapes of the backend's JSON (mirror of the Java DTOs).

export type Gender = 'MAN' | 'WOMAN' | 'NON_BINARY';
export type InterestedIn = 'MEN' | 'WOMEN' | 'EVERYONE';
export type Intent = 'SERIOUS_RELATIONSHIP' | 'MARRIAGE' | 'CASUAL_DATING' | 'FRIENDSHIP' | 'NOT_SURE';

export interface AuthResponse {
  accessToken: string;
  userId: number;
  onboardingComplete: boolean;
}

export interface Photo { id: number; url: string }

export interface PromptAnswerView { id: number; promptId: number; question: string; answer: string }

export interface ProfileCard {
  id: number;
  name: string | null;
  age: number | null;
  city: string | null;
  state: string | null;
  distanceKm: number | null;
  intent: Intent | null;
  verified: boolean;
  photos: Photo[];
  bio: string | null;
  prompts: PromptAnswerView[];
  details: Record<string, string | number>;
  interests: string[];
  languages: string[];
}

export interface Preferences { minAge: number; maxAge: number; maxDistanceKm: number; intents: Intent[] }

export interface Me {
  id: number;
  phone: string | null;
  email: string | null;
  dob: string | null;
  gender: Gender | null;
  interestedIn: InterestedIn | null;
  hasLocation: boolean;
  onboardingComplete: boolean;
  interestIds: number[];
  preferences: Preferences;
  card: ProfileCard;
}

export interface Interest { id: number; name: string }
export interface Prompt { id: number; question: string }

export interface SwipeResult { matched: boolean; matchId: number | null }

export interface LikeReceived { profile: ProfileCard; comment: string | null; likedAt: string }

export interface MatchSummary {
  matchId: number;
  userId: number;
  name: string | null;
  photoUrl: string | null;
  matchedAt: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageMine: boolean;
  unreadCount: number;
  dateReadyUnlocked: boolean;
}

export interface ChatMessage {
  id: number;
  matchId: number;
  senderId: number;
  content: string;
  sentAt: string;
  readAt: string | null;
}

export type DateStage = 'LOCKED' | 'AVAILABLE' | 'WAITING' | 'FORM' | 'ANSWER' | 'WAITING_FOR_THEM' | 'REVEALED';

export interface DateQuestionView { id: number; question: string; answer: string | null; skipped: boolean; answered: boolean }

export interface DateReveal {
  theyLikedAboutMe: string | null;
  iLikedAboutThem: string | null;
  myQuestionsTheirAnswers: DateQuestionView[];
  theirQuestionsMyAnswers: DateQuestionView[];
}

export interface DateReadyView {
  requestId: number | null;
  stage: DateStage;
  expiresAt: string | null;
  questionsForMe: DateQuestionView[];
  reveal: DateReveal | null;
}

export type ReportReason =
  | 'FAKE_PROFILE' | 'INAPPROPRIATE_PHOTOS' | 'HARASSMENT' | 'SPAM' | 'UNDERAGE' | 'OFFLINE_BEHAVIOUR' | 'OTHER';

export interface ProfileUpdate {
  bio?: string | null;
  heightCm?: number | null;
  education?: string | null;
  college?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  hometown?: string | null;
  religion?: string | null;
  zodiac?: string | null;
  drinking?: string | null;
  smoking?: string | null;
  workout?: string | null;
  diet?: string | null;
  pets?: string | null;
  kids?: string | null;
  languages?: string[];
  interestIds?: number[];
  prompts?: { promptId: number; answer: string }[];
}
