import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Loading } from '../components/ui';
import { AboutMeScreen } from '../screens/onboarding/AboutMeScreen';
import { BasicInfoScreen } from '../screens/onboarding/BasicInfoScreen';
import { IntentScreen } from '../screens/onboarding/IntentScreen';
import { LocationScreen } from '../screens/onboarding/LocationScreen';
import { PhotosScreen } from '../screens/onboarding/PhotosScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ChatsScreen } from '../screens/chat/ChatsScreen';
import { DateReadyScreen } from '../screens/date/DateReadyScreen';
import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { LikesScreen } from '../screens/discover/LikesScreen';
import { ViewProfileScreen } from '../screens/discover/ViewProfileScreen';
import { MyProfileScreen } from '../screens/profile/MyProfileScreen';
import { PreferencesScreen } from '../screens/profile/PreferencesScreen';
import { ReportScreen } from '../screens/profile/ReportScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { colors, fonts } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  Discover: 'fire',
  Likes: 'heart-outline',
  Chats: 'message-outline',
  Profile: 'account-outline',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 72, paddingTop: 8 },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 12 },
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={TAB_ICONS[route.name]} color={color} size={size} />,
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Likes" component={LikesScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={MyProfileScreen} />
    </Tab.Navigator>
  );
}

const stackOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.serif, fontSize: 20 },
  contentStyle: { backgroundColor: colors.background },
  headerBackButtonDisplayMode: 'minimal' as const,
};

/** Shows a different set of screens depending on login / onboarding status. */
export function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') return <Loading />;

  return (
    <Stack.Navigator screenOptions={stackOptions}>
      {status === 'signedOut' ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: '' }} />
        </>
      ) : status === 'onboarding' ? (
        <>
          <Stack.Screen name="BasicInfo" component={BasicInfoScreen} options={{ title: 'Step 1 of 5' }} />
          <Stack.Screen name="Intent" component={IntentScreen} options={{ title: 'Step 2 of 5' }} />
          <Stack.Screen name="AboutMe" component={AboutMeScreen} options={{ title: 'Step 3 of 5' }} />
          <Stack.Screen name="Photos" component={PhotosScreen} options={{ title: 'Step 4 of 5' }} />
          <Stack.Screen name="Location" component={LocationScreen} options={{ title: 'Step 5 of 5' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="ViewProfile" component={ViewProfileScreen} options={{ title: '' }} />
          <Stack.Screen name="DateReady" component={DateReadyScreen} options={{ title: 'Date Ready' }} />
          <Stack.Screen name="BasicInfo" component={BasicInfoScreen} options={{ title: 'Basic info' }} />
          <Stack.Screen name="Intent" component={IntentScreen} options={{ title: 'Intent' }} />
          <Stack.Screen name="AboutMe" component={AboutMeScreen} options={{ title: 'Edit profile' }} />
          <Stack.Screen name="Photos" component={PhotosScreen} options={{ title: 'Photos' }} />
          <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ title: 'Filters' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Report' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
