import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { discoverApi } from '../../api/endpoints';
import type { ProfileCard } from '../../api/types';
import { LikeModal } from '../../components/LikeModal';
import { ProfileView } from '../../components/ProfileView';
import { Button, EmptyState, IconButton, Loading, Logo, Screen } from '../../components/ui';
import type { RootStackParamList } from '../../navigation/types';
import { shadow, space } from '../../theme';

/**
 * Discover tab (Hinge style): one full profile at a time. Scroll through it,
 * like a specific photo/prompt (opens LikeModal), or pass with the X button.
 */
export function DiscoverScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [queue, setQueue] = useState<ProfileCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [likeTarget, setLikeTarget] = useState<string | null>(null);
  const [likeOpen, setLikeOpen] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setQueue(await discoverApi.feed());
    } catch (e: any) {
      setError(e.message);
      setQueue([]);
    }
  }, []);

  // Load once when the tab is first opened; after that the feed refills itself when it runs out.
  const loadedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!loadedOnce.current) {
        loadedOnce.current = true;
        load();
      }
    }, [load]),
  );

  const current = queue?.[0];

  function next() {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    const rest = (queue ?? []).slice(1);
    setQueue(rest);
    if (rest.length === 0) load(); // ran out → fetch the next batch
  }

  async function pass() {
    if (!current) return;
    try {
      await discoverApi.pass(current.id);
    } catch {
      // already answered or gone — just move on
    }
    next();
  }

  async function sendLike(comment: string) {
    if (!current) return;
    const who = current;
    try {
      const res = await discoverApi.like(who.id, comment || undefined);
      setLikeOpen(false);
      next();
      if (res.matched && res.matchId) {
        Alert.alert("It's a spark!", `Aap aur ${who.name} ek dusre ko pasand karte ho.`, [
          { text: 'Baad mein' },
          { text: 'Chat karo', onPress: () => navigation.navigate('Chat', { matchId: res.matchId!, userId: who.id, name: who.name ?? '' }) },
        ]);
      }
    } catch (e: any) {
      setLikeOpen(false);
      Alert.alert('Oops', e.message);
      next();
    }
  }

  return (
    <Screen padded={false}>
      <View style={s.header}>
        <Logo />
        <IconButton icon="tune-variant" label="Filters" size={44} onPress={() => navigation.navigate('Preferences')} />
      </View>

      {queue === null ? (
        <Loading />
      ) : !current ? (
        <View style={{ flex: 1 }}>
          <EmptyState
            title={error ? 'Kuch gadbad hai' : 'Abhi itna hi'}
            text={error ?? 'Aas-paas abhi aur profiles nahi hain. Filters thode badhao ya thodi der baad dekho.'}
          />
          <View style={{ padding: space.lg }}>
            <Button title="Dobara dekho" variant="secondary" onPress={load} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: space.lg, paddingBottom: 110 }}>
            <ProfileView
              profile={current}
              onLike={(what) => {
                setLikeTarget(what);
                setLikeOpen(true);
              }}
            />
          </ScrollView>
          <View style={s.passWrap}>
            <IconButton icon="close" label="Pass" size={56} onPress={pass} />
          </View>
          <LikeModal
            visible={likeOpen}
            target={likeTarget}
            name={current.name ?? ''}
            onClose={() => setLikeOpen(false)}
            onSend={sendLike}
          />
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.sm },
  passWrap: { position: 'absolute', left: space.lg, bottom: space.lg, borderRadius: 28, ...shadow },
});
