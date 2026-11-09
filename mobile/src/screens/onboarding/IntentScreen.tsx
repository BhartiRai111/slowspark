import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { meApi } from '../../api/endpoints';
import type { Intent } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Button, ErrorText, Screen, Subtitle, Title } from '../../components/ui';
import { INTENT_LABELS } from '../../lib/labels';
import type { ScreenProps } from '../../navigation/types';
import { colors, fonts, radius, space } from '../../theme';

const OPTIONS: { value: Intent; hint: string }[] = [
  { value: 'SERIOUS_RELATIONSHIP', hint: 'Lambe rishte ki talash' },
  { value: 'MARRIAGE', hint: 'Shaadi ke liye sahi insaan' },
  { value: 'CASUAL_DATING', hint: 'Milna-julna, dekhte hain kya hota hai' },
  { value: 'FRIENDSHIP', hint: 'Naye dost' },
  { value: 'NOT_SURE', hint: 'Abhi khud bhi tay nahi' },
];

/** Onboarding step 2: "Aap SlowSpark pe kyun ho?" — used to match people with the same intent. */
export function IntentScreen({ navigation, route }: ScreenProps<'Intent'>) {
  const editing = route.params?.editing ?? false;
  const { me, refreshMe } = useAuth();
  const [intent, setIntent] = useState<Intent | null>(me?.card.intent ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!intent) return setError('Ek option chuno');
    setSaving(true);
    setError(null);
    try {
      await meApi.intent(intent);
      if (editing) {
        await refreshMe();
        navigation.goBack();
      } else {
        navigation.navigate('AboutMe');
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
          <Title>Aap SlowSpark pe kyun ho?</Title>
          <Subtitle>Hum aapko pehle unhe dikhayenge jo yahi dhundh rahe hain.</Subtitle>
        </View>
        <View style={{ gap: space.md }}>
          {OPTIONS.map((o) => {
            const selected = intent === o.value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setIntent(o.value)}
                style={{
                  padding: space.lg, borderRadius: radius.md, borderWidth: 1.5,
                  borderColor: selected ? colors.accent : colors.border,
                  backgroundColor: selected ? colors.accentSoft : colors.surface,
                }}
              >
                <Text style={{ fontFamily: fonts.serif, fontSize: 19, color: colors.text }}>{INTENT_LABELS[o.value]}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 2 }}>{o.hint}</Text>
              </Pressable>
            );
          })}
        </View>
        <ErrorText message={error} />
        <Button title={editing ? 'Save' : 'Aage'} onPress={save} loading={saving} />
      </View>
    </Screen>
  );
}
