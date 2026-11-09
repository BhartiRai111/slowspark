import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { ProfileView } from '../../components/ProfileView';
import { Loading, Screen, Title } from '../../components/ui';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts, radius, space } from '../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Profile tab: quick links to edit things, then a preview of how others see you. */
export function MyProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { me, refreshMe } = useAuth();

  useFocusEffect(useCallback(() => { refreshMe(); }, [refreshMe]));

  if (!me) return <Screen><Loading /></Screen>;

  const links: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; go: () => void }[] = [
    { icon: 'pencil-outline', label: 'Edit profile', go: () => navigation.navigate('AboutMe', { editing: true }) },
    { icon: 'image-multiple-outline', label: 'Photos', go: () => navigation.navigate('Photos', { editing: true }) },
    { icon: 'compass-outline', label: 'Intent', go: () => navigation.navigate('Intent', { editing: true }) },
    { icon: 'account-outline', label: 'Basic info', go: () => navigation.navigate('BasicInfo', { editing: true }) },
    { icon: 'tune-variant', label: 'Filters', go: () => navigation.navigate('Preferences') },
    { icon: 'cog-outline', label: 'Settings', go: () => navigation.navigate('Settings') },
  ];

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: 48 }}>
        <Title>Profile</Title>
        <View style={s.grid}>
          {links.map((l) => (
            <Pressable key={l.label} accessibilityRole="button" onPress={l.go} style={s.tile}>
              <MaterialCommunityIcons name={l.icon} size={22} color={colors.accent} />
              <Text style={s.tileText}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.preview}>Doosron ko aap aise dikhte ho</Text>
        <ProfileView profile={me.card} />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.lg,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  tileText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.text },
  preview: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textMuted },
});
