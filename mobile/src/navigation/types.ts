import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Every screen and the params it receives. TypeScript checks navigation.navigate(...) calls against this.
export type RootStackParamList = {
  // Logged out
  Welcome: undefined;
  Login: undefined;
  // Onboarding (also reused for editing, with editing: true)
  BasicInfo: { editing?: boolean } | undefined;
  Intent: { editing?: boolean } | undefined;
  AboutMe: { editing?: boolean } | undefined;
  Photos: { editing?: boolean } | undefined;
  Location: undefined;
  // Main app
  Tabs: undefined;
  Chat: { matchId: number; userId: number; name: string };
  ViewProfile: { userId: number; fromLikes?: boolean; comment?: string | null };
  DateReady: { matchId: number; name: string };
  Preferences: undefined;
  Settings: undefined;
  Report: { userId: number; name: string; matchId?: number };
};

export type TabParamList = {
  Discover: undefined;
  Likes: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
