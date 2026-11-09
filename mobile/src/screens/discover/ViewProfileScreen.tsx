import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { discoverApi } from '../../api/endpoints';
import type { ProfileCard } from '../../api/types';
import { LikeModal } from '../../components/LikeModal';
import { ProfileView } from '../../components/ProfileView';
import { Button, ErrorText, Loading } from '../../components/ui';
import type { ScreenProps } from '../../navigation/types';
import { colors, fonts, radius, space } from '../../theme';

/**
 * Full profile of someone. From the Likes tab it also shows their comment
 * plus "Like back" / "Pass" buttons.
 */
export function ViewProfileScreen({ navigation, route }: ScreenProps<'ViewProfile'>) {
  const { userId, fromLikes, comment } = route.params;
  const [profile, setProfile] = useState<ProfileCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [likeOpen, setLikeOpen] = useState(false);

  useEffect(() => {
    discoverApi.profile(userId).then(setProfile).catch((e) => setError(e.message));
  }, [userId]);

  async function likeBack(text: string) {
    try {
      const res = await discoverApi.like(userId, text || undefined);
      setLikeOpen(false);
      if (res.matched && res.matchId) {
        navigation.replace('Chat', { matchId: res.matchId, userId, name: profile?.name ?? '' });
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      setLikeOpen(false);
      Alert.alert('Oops', e.message);
    }
  }

  async function pass() {
    try {
      await discoverApi.pass(userId);
    } finally {
      navigation.goBack();
    }
  }

  if (error) return <View style={{ padding: space.lg }}><ErrorText message={error} /></View>;
  if (!profile) return <Loading />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 48 }}>
        {fromLikes && comment ? (
          <View style={{ backgroundColor: colors.accentSoft, padding: space.lg, borderRadius: radius.md }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.accentDark }}>{profile.name} ne likha</Text>
            <Text style={{ fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text, marginTop: 4 }}>"{comment}"</Text>
          </View>
        ) : null}
        <ProfileView profile={profile} />
        <Button
          title="Report ya block karo"
          variant="ghost"
          onPress={() => navigation.navigate('Report', { userId, name: profile.name ?? '' })}
        />
      </ScrollView>
      {fromLikes ? (
        <View style={{ flexDirection: 'row', gap: space.md, padding: space.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button title="Pass" variant="secondary" onPress={pass} style={{ flex: 1 }} />
          <Button title="Like back" onPress={() => setLikeOpen(true)} style={{ flex: 1 }} />
        </View>
      ) : null}
      <LikeModal visible={likeOpen} target={null} name={profile.name ?? ''} onClose={() => setLikeOpen(false)} onSend={likeBack} />
    </View>
  );
}
