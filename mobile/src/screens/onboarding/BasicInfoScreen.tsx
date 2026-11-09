import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { meApi } from '../../api/endpoints';
import type { Gender, InterestedIn } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Button, ChipSelect, ErrorText, Label, Screen, Subtitle, TextField, Title, styles } from '../../components/ui';
import { GENDER_LABELS, INTERESTED_IN_LABELS } from '../../lib/labels';
import type { ScreenProps } from '../../navigation/types';
import { space } from '../../theme';

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ageOf(d: Date) {
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

/** Onboarding step 1: name, date of birth (18+ only), gender, who you want to meet. */
export function BasicInfoScreen({ navigation, route }: ScreenProps<'BasicInfo'>) {
  const editing = route.params?.editing ?? false;
  const { me, refreshMe } = useAuth();
  const [name, setName] = useState(me?.card.name ?? '');
  const [dob, setDob] = useState<Date | null>(me?.dob ? new Date(me.dob) : null);
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState<Gender | null>(me?.gender ?? null);
  const [interestedIn, setInterestedIn] = useState<InterestedIn | null>(me?.interestedIn ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (name.trim().length < 2) return setError('Apna naam likho');
    if (!dob) return setError('Date of birth chuno');
    if (ageOf(dob) < 18) return setError('SlowSpark sirf 18+ ke liye hai');
    if (!gender || !interestedIn) return setError('Gender aur "kisse milna hai" dono chuno');
    setSaving(true);
    try {
      await meApi.basic({ name: name.trim(), dob: toIsoDate(dob), gender, interestedIn });
      if (editing) {
        await refreshMe();
        navigation.goBack();
      } else {
        navigation.navigate('Intent');
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
          <Title>Thoda apne baare mein</Title>
          <Subtitle>Naam aur umar profile pe dikhegi. Date of birth nahi.</Subtitle>
        </View>

        <TextField label="Pehla naam" value={name} onChangeText={setName} placeholder="Ananya" maxLength={60} />

        <View style={{ gap: space.xs }}>
          <Label>Date of birth</Label>
          <Pressable accessibilityRole="button" onPress={() => setShowPicker(true)} style={styles.input}>
            <Text style={{ fontSize: 16 }}>{dob ? dob.toDateString().slice(4) : 'Chuno'}</Text>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={dob ?? new Date(2000, 0, 1)}
              mode="date"
              maximumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowPicker(Platform.OS === 'ios');
                if (date) setDob(date);
              }}
            />
          ) : null}
        </View>

        <View style={{ gap: space.sm }}>
          <Label>Main hoon</Label>
          <ChipSelect options={['WOMAN', 'MAN', 'NON_BINARY'] as Gender[]} value={gender} onChange={setGender} labels={GENDER_LABELS} />
        </View>

        <View style={{ gap: space.sm }}>
          <Label>Mujhe milna hai</Label>
          <ChipSelect options={['MEN', 'WOMEN', 'EVERYONE'] as InterestedIn[]} value={interestedIn} onChange={setInterestedIn} labels={INTERESTED_IN_LABELS} />
        </View>

        <ErrorText message={error} />
        <Button title={editing ? 'Save' : 'Aage'} onPress={save} loading={saving} />
      </View>
    </Screen>
  );
}
