import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { meApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { Button, ErrorText, Screen, Subtitle, Title } from '../../components/ui';
import { pickImage, uploadImage } from '../../lib/upload';
import type { ScreenProps } from '../../navigation/types';
import { colors, radius, space } from '../../theme';

const SLOTS = 6;

/** Onboarding step 4 / edit photos: 2–6 photos. First photo is the main one. */
export function PhotosScreen({ navigation, route }: ScreenProps<'Photos'>) {
  const editing = route.params?.editing ?? false;
  const { me, refreshMe } = useAuth();
  const [urls, setUrls] = useState<string[]>(me?.card.photos.map((p) => p.url) ?? []);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addPhoto(slot: number) {
    setError(null);
    try {
      const local = await pickImage();
      if (!local) return;
      setUploadingSlot(slot);
      const url = await uploadImage(local);
      setUrls((prev) => [...prev, url]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingSlot(null);
    }
  }

  function removePhoto(index: number) {
    setUrls(urls.filter((_, i) => i !== index));
  }

  async function save() {
    if (urls.length < 2) return setError('Kam se kam 2 photos lagao');
    setSaving(true);
    setError(null);
    try {
      await meApi.photos(urls);
      if (editing) {
        await refreshMe();
        navigation.goBack();
      } else {
        navigation.navigate('Location');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <View style={{ gap: space.xl }}>
        <View>
          <Title>Apni photos</Title>
          <Subtitle>2 se 6 photos. Pehli photo main photo hogi. Saaf chehra wali photos best rehti hain.</Subtitle>
        </View>

        <View style={s.grid}>
          {Array.from({ length: SLOTS }).map((_, i) => {
            const url = urls[i];
            return (
              <View key={i} style={s.slot}>
                {url ? (
                  <>
                    <Image source={{ uri: url }} style={s.image} accessibilityLabel={`Photo ${i + 1}`} />
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`} onPress={() => removePhoto(i)} style={s.remove}>
                      <MaterialCommunityIcons name="close" size={16} color={colors.text} />
                    </Pressable>
                  </>
                ) : uploadingSlot === i ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add photo"
                    disabled={i !== urls.length || uploadingSlot !== null}
                    onPress={() => addPhoto(i)}
                    style={s.add}
                  >
                    <MaterialCommunityIcons name="plus" size={28} color={i === urls.length ? colors.accent : colors.borderStrong} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        <ErrorText message={error} />
        <Button title={editing ? 'Save' : 'Aage'} onPress={save} loading={saving} disabled={uploadingSlot !== null} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  slot: {
    width: '31%', aspectRatio: 4 / 5, borderRadius: radius.sm, backgroundColor: colors.chip,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  add: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  remove: {
    position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
});
