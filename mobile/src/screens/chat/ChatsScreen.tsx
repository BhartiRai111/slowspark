import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { matchApi } from '../../api/endpoints';
import type { MatchSummary } from '../../api/types';
import { EmptyState, Label, Loading, Screen, Title } from '../../components/ui';
import { timeAgo } from '../../lib/labels';
import type { RootStackParamList } from '../../navigation/types';
import { useRealtime } from '../../realtime/RealtimeContext';
import { colors, fonts, space } from '../../theme';

/** Chats tab: new matches on top (no messages yet), conversations below. */
export function ChatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);

  const load = useCallback(() => {
    matchApi.list().then(setMatches).catch(() => setMatches([]));
  }, []);

  useFocusEffect(load);

  useRealtime((e) => {
    if (e.type === 'NEW_MESSAGE' || e.type === 'NEW_MATCH' || e.type === 'UNMATCHED') load();
  });

  const open = (m: MatchSummary) => navigation.navigate('Chat', { matchId: m.matchId, userId: m.userId, name: m.name ?? '' });

  if (matches === null) return <Screen><Loading /></Screen>;

  const fresh = matches.filter((m) => !m.lastMessage);
  const talking = matches
    .filter((m) => m.lastMessage)
    .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));

  return (
    <Screen padded={false}>
      <View style={{ padding: space.lg, paddingBottom: space.sm }}>
        <Title>Chats</Title>
      </View>
      {matches.length === 0 ? (
        <EmptyState title="Abhi koi match nahi" text="Discover mein profiles dekho aur jo pasand aaye unhe like karo." />
      ) : (
        <FlatList
          data={talking}
          keyExtractor={(m) => String(m.matchId)}
          contentContainerStyle={{ paddingBottom: space.xl }}
          ListHeaderComponent={
            fresh.length > 0 ? (
              <View style={{ gap: space.sm, paddingVertical: space.md }}>
                <View style={{ paddingHorizontal: space.lg }}><Label>Naye matches</Label></View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.md }}>
                  {fresh.map((m) => (
                    <Pressable key={m.matchId} accessibilityRole="button" onPress={() => open(m)} style={{ alignItems: 'center', gap: 6 }}>
                      {m.photoUrl ? <Image source={{ uri: m.photoUrl }} style={s.bigAvatar} accessibilityLabel={m.name ?? ''} /> : <View style={s.bigAvatar} />}
                      <Text style={s.smallName}>{m.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => open(item)} style={s.row}>
              {item.photoUrl ? <Image source={{ uri: item.photoUrl }} style={s.avatar} accessibilityLabel={item.name ?? ''} /> : <View style={s.avatar} />}
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={s.name}>{item.name}</Text>
                  {item.lastMessageAt ? <Text style={s.time}>{timeAgo(item.lastMessageAt)}</Text> : null}
                </View>
                <Text style={[s.preview, item.unreadCount > 0 && s.unread]} numberOfLines={1}>
                  {item.lastMessageMine ? 'Aap: ' : ''}{item.lastMessage}
                </Text>
                {item.dateReadyUnlocked ? <Text style={s.dateTag}>Date Ready unlocked</Text> : null}
              </View>
              {item.unreadCount > 0 ? (
                <View style={s.badge}><Text style={s.badgeText}>{item.unreadCount}</Text></View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  bigAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.photoPlaceholder, borderWidth: 2, borderColor: colors.accent },
  smallName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.photoPlaceholder },
  name: { fontFamily: fonts.serif, fontSize: 18, color: colors.text },
  time: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  preview: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  unread: { fontFamily: fonts.bodySemi, color: colors.text },
  dateTag: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.accentDark },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.white },
});
