import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { meApi } from '../../api/endpoints';
import type { Intent } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Button, ChipSelect, ErrorText, Label, MultiChipSelect, Screen, Subtitle } from '../../components/ui';
import { INTENT_LABELS } from '../../lib/labels';
import type { ScreenProps } from '../../navigation/types';
import { colors, fonts, space } from '../../theme';

const DISTANCES = [10, 25, 50, 100, 300] as const;
const INTENTS = Object.keys(INTENT_LABELS) as Intent[];

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <View style={s.stepper}>
      <Text style={s.stepLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - 1))} style={s.stepBtn}>
          <MaterialCommunityIcons name="minus" size={20} color={colors.text} />
        </Pressable>
        <Text style={s.stepValue}>{value}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + 1))} style={s.stepBtn}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

/** Discover filters: age range, distance, intents. */
export function PreferencesScreen({ navigation }: ScreenProps<'Preferences'>) {
  const { me, refreshMe } = useAuth();
  const p = me?.preferences;
  const [minAge, setMinAge] = useState(p?.minAge ?? 18);
  const [maxAge, setMaxAge] = useState(p?.maxAge ?? 45);
  const [distance, setDistance] = useState<number | null>(p?.maxDistanceKm ?? 50);
  const [intents, setIntents] = useState<Intent[]>(p?.intents ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await meApi.preferences({ minAge, maxAge, maxDistanceKm: distance ?? 50, intents });
      await refreshMe();
      navigation.goBack();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <View style={{ gap: space.xl }}>
        <View style={{ gap: space.md }}>
          <Label>Age</Label>
          <Stepper label="Kam se kam" value={minAge} min={18} max={maxAge} onChange={setMinAge} />
          <Stepper label="Zyada se zyada" value={maxAge} min={minAge} max={80} onChange={setMaxAge} />
        </View>
        <View style={{ gap: space.sm }}>
          <Label>Doori (km)</Label>
          <ChipSelect options={DISTANCES} value={distance as (typeof DISTANCES)[number] | null} onChange={setDistance} />
        </View>
        <View style={{ gap: space.sm }}>
          <Label>Kinhe dekhna hai</Label>
          <Subtitle>Kuch na chuna to sirf aapke jaise intent wale dikhenge.</Subtitle>
          <MultiChipSelect options={INTENTS} value={intents} onChange={setIntents} labels={INTENT_LABELS} />
        </View>
        <ErrorText message={error} />
        <Button title="Save" onPress={save} loading={saving} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { fontFamily: fonts.body, fontSize: 16, color: colors.text },
  stepBtn: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  stepValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.text, minWidth: 32, textAlign: 'center' },
});
