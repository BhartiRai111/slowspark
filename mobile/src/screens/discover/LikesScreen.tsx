import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { discoverApi } from '../../api/endpoints';
import type { LikeReceived } from '../../api/types';
import { EmptyState, Loading, Screen, Title } from '../../components/ui';
import { INTENT_LABELS } from '../../lib/labels';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts, radius, space } from '../../theme';

/** Likes tab: people who liked you. Tap to see the full profile and like back or pass. */
export function LikesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [likes, setLikes] = useState<LikeReceived[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      discoverApi.likes().then(setLikes).catch(() => setLikes([]));
    }, []),
  );

  return (
    <Screen padded={false}>
      <View style={{ padding: space.lg, paddingBottom: space.sm }}>
        <Title>Likes</Title>
      </View>
      {likes === null ? (
        <Loading />
      ) : likes.length === 0 ? (
        <EmptyState title="Abhi koi like nahi" text="Profile mein achhe prompts aur photos lagao, likes zaroor aayenge." />
      ) : (
        <FlatList
          data={likes}
          keyExtractor={(l) => String(l.profile.id)}
          contentContainerStyle={{ padding: space.lg, gap: space.md }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('ViewProfile', { userId: item.profile.id, fromLikes: true, comment: item.comment })}
              style={s.row}
            >
              {item.profile.photos[0] ? (
                <Image source={{ uri: item.profile.photos[0].url }} style={s.avatar} accessibilityLabel={item.profile.name ?? ''} />
              ) : (
                <View style={s.avatar} />
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.name}>{item.profile.name}, {item.profile.age}</Text>
                {item.profile.intent ? <Text style={s.meta}>{INTENT_LABELS[item.profile.intent]}</Text> : null}
                {item.comment ? <Text style={s.comment} numberOfLines={2}>"{item.comment}"</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: colors.surface,
    padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  avatar: { width: 72, height: 90, borderRadius: radius.sm, backgroundColor: colors.photoPlaceholder },
  name: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  comment: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.accentDark, marginTop: 4 },
});
