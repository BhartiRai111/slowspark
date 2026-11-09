import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ProfileCard } from '../api/types';
import { detailChips, INTENT_LABELS } from '../lib/labels';
import { colors, fonts, radius, shadow, space } from '../theme';
import { Chip, IconButton } from './ui';

/**
 * Hinge-style full profile: name, intent badge, then photos and prompts interleaved.
 * When onLike is given, each photo and prompt gets its own like button,
 * so people like a specific thing ("Tumhari chai wali baat").
 */
export function ProfileView({ profile, onLike }: {
  profile: ProfileCard;
  onLike?: (what: string) => void;
}) {
  const chips = detailChips(profile.details);
  const photos = profile.photos;
  const prompts = profile.prompts;

  // Photo, prompt, photo, prompt... then any leftover photos.
  const blocks: React.ReactNode[] = [];
  const count = Math.max(photos.length, prompts.length);
  for (let i = 0; i < count; i++) {
    const photo = photos[i];
    const prompt = prompts[i];
    if (photo) {
      blocks.push(
        <View key={`p${photo.id}`} style={s.photoWrap}>
          <Image source={{ uri: photo.url }} style={s.photo} accessibilityLabel={`${profile.name ?? 'Profile'} photo ${i + 1}`} />
          {onLike ? (
            <View style={s.likeCorner}>
              <IconButton icon="heart-outline" label="Like this photo" onPress={() => onLike(`photo ${i + 1}`)} />
            </View>
          ) : null}
        </View>,
      );
    }
    if (i === 0 && chips.length > 0) {
      blocks.push(
        <View key="chips" style={s.chips}>
          {chips.map((c) => <Chip key={c} label={c} />)}
        </View>,
      );
    }
    if (prompt) {
      blocks.push(
        <View key={`q${prompt.id}`} style={s.promptCard}>
          <Text style={s.promptQuestion}>{prompt.question}</Text>
          <Text style={s.promptAnswer}>{prompt.answer}</Text>
          {onLike ? (
            <View style={s.promptLike}>
              <IconButton icon="heart-outline" label="Like this prompt" size={44} onPress={() => onLike(prompt.question)} />
            </View>
          ) : null}
        </View>,
      );
    }
  }

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <View style={s.nameRow}>
          <Text style={s.name}>{profile.name}{profile.age ? `, ${profile.age}` : ''}</Text>
          <Text style={s.place}>
            {[profile.city, profile.distanceKm != null ? `${profile.distanceKm} km` : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          {profile.intent ? (
            <View style={[s.badge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[s.badgeText, { color: colors.accentDark }]}>{INTENT_LABELS[profile.intent]}</Text>
            </View>
          ) : null}
          {profile.verified ? (
            <View style={[s.badge, { backgroundColor: colors.successSoft, flexDirection: 'row', gap: 4 }]}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={colors.success} />
              <Text style={[s.badgeText, { color: colors.success }]}>Verified</Text>
            </View>
          ) : null}
        </View>
      </View>

      {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}

      {blocks}

      {profile.interests.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <Text style={s.sectionTitle}>Interests</Text>
          <View style={s.chips}>{profile.interests.map((i) => <Chip key={i} label={i} />)}</View>
        </View>
      ) : null}

      {profile.languages.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <Text style={s.sectionTitle}>Languages</Text>
          <View style={s.chips}>{profile.languages.map((l) => <Chip key={l} label={l} />)}</View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  name: { fontFamily: fonts.serif, fontSize: 32, color: colors.text },
  place: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, alignItems: 'center' },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  bio: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text },
  photoWrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.photoPlaceholder },
  photo: { width: '100%', aspectRatio: 4 / 5 },
  likeCorner: { position: 'absolute', right: 14, bottom: 14, borderRadius: 26, ...shadow },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  promptCard: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 18, paddingRight: 70, gap: 6,
  },
  promptQuestion: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textMuted },
  promptAnswer: { fontFamily: fonts.serifMedium, fontSize: 21, lineHeight: 28, color: colors.text },
  promptLike: { position: 'absolute', right: 14, bottom: 14 },
  sectionTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textMuted },
});
