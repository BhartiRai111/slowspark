import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { meApi, metaApi } from '../../api/endpoints';
import type { Interest, Prompt } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import {
  Button, ChipSelect, ErrorText, Label, Loading, MultiChipSelect, Screen, Subtitle, TextField, Title,
} from '../../components/ui';
import { DETAIL_OPTIONS } from '../../lib/labels';
import type { ScreenProps } from '../../navigation/types';
import { colors, fonts, radius, space } from '../../theme';

type ChipField = 'education' | 'religion' | 'zodiac' | 'drinking' | 'smoking' | 'workout' | 'diet' | 'pets' | 'kids';

const CHIP_FIELDS: { key: ChipField; title: string }[] = [
  { key: 'education', title: 'Education' },
  { key: 'drinking', title: 'Drinking' },
  { key: 'smoking', title: 'Smoking' },
  { key: 'workout', title: 'Workout' },
  { key: 'diet', title: 'Diet' },
  { key: 'pets', title: 'Pets' },
  { key: 'kids', title: 'Kids' },
  { key: 'religion', title: 'Religion' },
  { key: 'zodiac', title: 'Zodiac' },
];

/**
 * Onboarding step 3 and "Edit profile": bio, details, lifestyle chips, languages,
 * interests (max 5) and up to 3 prompts. Everything here is optional.
 */
export function AboutMeScreen({ navigation, route }: ScreenProps<'AboutMe'>) {
  const editing = route.params?.editing ?? false;
  const { me, refreshMe } = useAuth();
  const d = me?.card.details ?? {};
  const str = (k: string) => (d[k] != null ? String(d[k]) : '');

  const [interests, setInterests] = useState<Interest[] | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [bio, setBio] = useState(me?.card.bio ?? '');
  const [height, setHeight] = useState(str('heightCm'));
  const [jobTitle, setJobTitle] = useState(str('jobTitle'));
  const [company, setCompany] = useState(str('company'));
  const [college, setCollege] = useState(str('college'));
  const [hometown, setHometown] = useState(str('hometown'));
  const [chips, setChips] = useState<Record<ChipField, string | null>>(() => {
    const init = {} as Record<ChipField, string | null>;
    CHIP_FIELDS.forEach((f) => { init[f.key] = str(f.key) || null; });
    return init;
  });
  const [languages, setLanguages] = useState<string[]>(me?.card.languages ?? []);
  const [interestIds, setInterestIds] = useState<number[]>(me?.interestIds ?? []);
  const [answers, setAnswers] = useState<{ promptId: number; answer: string }[]>(
    me?.card.prompts.map((p) => ({ promptId: p.promptId, answer: p.answer })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([metaApi.interests(), metaApi.prompts()])
      .then(([i, p]) => { setInterests(i); setPrompts(p); })
      .catch((e) => setError(e.message));
  }, []);

  function togglePrompt(promptId: number) {
    if (answers.some((a) => a.promptId === promptId)) {
      setAnswers(answers.filter((a) => a.promptId !== promptId));
    } else if (answers.length < 3) {
      setAnswers([...answers, { promptId, answer: '' }]);
    }
  }

  async function save() {
    setError(null);
    const h = height ? Number(height) : null;
    if (h != null && (isNaN(h) || h < 120 || h > 230)) return setError('Height cm mein likho (120–230)');
    const filledPrompts = answers.filter((a) => a.answer.trim().length > 0);
    setSaving(true);
    try {
      await meApi.profile({
        bio: bio.trim() || null,
        heightCm: h,
        jobTitle: jobTitle.trim() || null,
        company: company.trim() || null,
        college: college.trim() || null,
        hometown: hometown.trim() || null,
        ...chips,
        languages,
        interestIds,
        prompts: filledPrompts.map((a) => ({ promptId: a.promptId, answer: a.answer.trim() })),
      });
      if (editing) {
        await refreshMe();
        navigation.goBack();
      } else {
        navigation.navigate('Photos');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!interests) return <Loading />;

  return (
    <Screen scroll>
      <View style={{ gap: space.xl }}>
        <View>
          <Title>Aapki kahani</Title>
          <Subtitle>Sab optional hai. Jitna zyada bataoge, utne achhe matches milenge.</Subtitle>
        </View>

        <TextField label="Bio" value={bio} onChangeText={setBio} multiline maxLength={300} placeholder="Do-teen line apne baare mein…" />

        <View style={{ gap: space.md }}>
          <Label>Prompts (3 tak chuno)</Label>
          {prompts.map((p) => {
            const chosen = answers.find((a) => a.promptId === p.id);
            return (
              <View key={p.id} style={{ gap: space.sm }}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!chosen }}
                  onPress={() => togglePrompt(p.id)}
                  style={{
                    padding: space.md, borderRadius: radius.sm, borderWidth: 1,
                    borderColor: chosen ? colors.accent : colors.border,
                    backgroundColor: chosen ? colors.accentSoft : colors.surface,
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text }}>{p.question}</Text>
                </Pressable>
                {chosen ? (
                  <TextField
                    value={chosen.answer}
                    onChangeText={(t) => setAnswers(answers.map((a) => (a.promptId === p.id ? { ...a, answer: t } : a)))}
                    placeholder="Aapka jawab…"
                    maxLength={250}
                    multiline
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <TextField label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="number-pad" maxLength={3} placeholder="165" />
          </View>
          <View style={{ flex: 2 }}>
            <TextField label="Hometown" value={hometown} onChangeText={setHometown} maxLength={80} placeholder="Varanasi" />
          </View>
        </View>
        <TextField label="Job title" value={jobTitle} onChangeText={setJobTitle} maxLength={80} placeholder="Software Engineer" />
        <TextField label="Company" value={company} onChangeText={setCompany} maxLength={80} />
        <TextField label="College" value={college} onChangeText={setCollege} maxLength={120} />

        {CHIP_FIELDS.map((f) => (
          <View key={f.key} style={{ gap: space.sm }}>
            <Label>{f.title}</Label>
            <ChipSelect
              options={DETAIL_OPTIONS[f.key] as readonly string[]}
              value={chips[f.key]}
              onChange={(v) => setChips({ ...chips, [f.key]: v })}
            />
          </View>
        ))}

        <View style={{ gap: space.sm }}>
          <Label>Languages</Label>
          <MultiChipSelect options={DETAIL_OPTIONS.languages as readonly string[]} value={languages} onChange={setLanguages} max={6} />
        </View>

        <View style={{ gap: space.sm }}>
          <Label>Interests (5 tak)</Label>
          <MultiChipSelect
            options={interests.map((i) => i.id)}
            labels={Object.fromEntries(interests.map((i) => [i.id, i.name]))}
            value={interestIds}
            onChange={setInterestIds}
            max={5}
          />
        </View>

        <ErrorText message={error} />
        <Button title={editing ? 'Save' : 'Aage'} onPress={save} loading={saving} />
      </View>
    </Screen>
  );
}
