import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dateApi } from '../../api/endpoints';
import type { DateQuestionView, DateReadyView } from '../../api/types';
import { Button, ErrorText, Label, Loading, Screen, Subtitle, TextField, Title } from '../../components/ui';
import type { ScreenProps } from '../../navigation/types';
import { useRealtime } from '../../realtime/RealtimeContext';
import { colors, fonts, radius, space } from '../../theme';

const SAFETY_TIPS = [
  'Pehli date kisi public jagah pe rakho: cafe, mall, park.',
  'Kisi dost ya family ko batao ki kahan aur kiske saath ja rahe ho.',
  'Apna transport khud rakho, pick-up na lo.',
  'Drinks apni nazron ke saamne rakho.',
  'Kuch bhi theek na lage to turant nikal jao aur app mein report karo.',
];

const PLACE_IDEAS = ['Ek shaant cafe', 'Bookstore + chai', 'Shaam ki walk, park ya ghaat', 'Museum ya art gallery', 'Street food trail'];

/**
 * The whole Date Ready flow on one screen. The backend tells us the "stage",
 * and we show the matching UI: choose → form → answer → wait → reveal + date plan.
 */
export function DateReadyScreen({ navigation, route }: ScreenProps<'DateReady'>) {
  const { matchId, name } = route.params;
  const [view, setView] = useState<DateReadyView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    dateApi.view(matchId).then(setView).catch((e) => setError(e.message));
  }, [matchId]);

  useEffect(load, [load]);

  useRealtime((e) => {
    if (e.type === 'DATE_UPDATE' && e.data.matchId === matchId) load();
  });

  async function act(fn: () => Promise<DateReadyView>) {
    setBusy(true);
    setError(null);
    try {
      setView(await fn());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!view) return <Screen>{error ? <ErrorText message={error} /> : <Loading />}</Screen>;

  return (
    <Screen scroll>
      <View style={{ gap: space.xl }}>
        {view.stage === 'LOCKED' && (
          <Intro icon="lock-outline" title="Thoda aur jaano" text={`${name} ke saath kam se kam 7 din aur thodi lambi baat-cheet ke baad "Date pe chalein?" khulega. SlowSpark mein jaldi kuch nahi.`} />
        )}

        {view.stage === 'AVAILABLE' && (
          <>
            <Intro icon="fire" title={`${name} ke saath date pe jaana chahoge?`} text="Aapka jawab unhe tab tak nahi dikhega jab tak dono haan na kahein. Agar unhone mana kiya, to unhe aapka jawab kabhi pata nahi chalega." />
            <View style={{ gap: space.md }}>
              <Button title="Haan, chalte hain" loading={busy} onPress={() => act(() => dateApi.choose(matchId, 'YES'))} />
              <Button title="Abhi nahi" variant="secondary" disabled={busy} onPress={() => act(() => dateApi.choose(matchId, 'NO'))} />
            </View>
          </>
        )}

        {view.stage === 'WAITING' && (
          <Intro icon="timer-sand" title="Jawab save ho gaya" text={`Agar ${name} ne bhi haan kaha, to aapko turant pata chalega aur agla step khulega.`} />
        )}

        {view.stage === 'FORM' && <FormStep name={name} busy={busy} onSubmit={(liked, qs) => act(() => dateApi.form(matchId, liked, qs))} />}

        {view.stage === 'ANSWER' && (
          <AnswerStep
            name={name}
            questions={view.questionsForMe.filter((q) => !q.answered)}
            busy={busy}
            onSubmit={(answers) => act(() => dateApi.answers(matchId, answers))}
          />
        )}

        {view.stage === 'WAITING_FOR_THEM' && (
          <Intro icon="timer-sand" title="Aapka kaam ho gaya" text={`Jaise hi ${name} apna hissa poora karenge, dono ke jawab ek saath dikhenge.`} />
        )}

        {view.stage === 'REVEALED' && view.reveal && (
          <>
            <Title>Ye rahe jawab</Title>
            {view.reveal.theyLikedAboutMe ? (
              <Card label={`${name} ko aap mein ye achha laga`} text={view.reveal.theyLikedAboutMe} highlight />
            ) : null}
            {view.reveal.iLikedAboutThem ? <Card label="Aapne likha tha" text={view.reveal.iLikedAboutThem} /> : null}

            <Label>Aapke sawaal, {name} ke jawab</Label>
            {view.reveal.myQuestionsTheirAnswers.map((q) => <QA key={q.id} q={q} />)}

            <Label>{name} ke sawaal, aapke jawab</Label>
            {view.reveal.theirQuestionsMyAnswers.map((q) => <QA key={q.id} q={q} />)}

            <View style={s.planBox}>
              <Text style={s.planTitle}>Date plan karo</Text>
              <Text style={s.planText}>Kuch ideas:</Text>
              {PLACE_IDEAS.map((p) => <Text key={p} style={s.bullet}>• {p}</Text>)}
              <Text style={[s.planText, { marginTop: space.md }]}>Safety pehle:</Text>
              {SAFETY_TIPS.map((t) => <Text key={t} style={s.bullet}>• {t}</Text>)}
            </View>
            <Button title="Chat mein plan karo" onPress={() => navigation.goBack()} />
          </>
        )}

        <ErrorText message={error} />
      </View>
    </Screen>
  );
}

function Intro({ icon, title, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; text: string }) {
  return (
    <View style={{ gap: space.md, alignItems: 'flex-start' }}>
      <View style={s.iconCircle}>
        <MaterialCommunityIcons name={icon} size={28} color={colors.accent} />
      </View>
      <Title>{title}</Title>
      <Subtitle>{text}</Subtitle>
    </View>
  );
}

function FormStep({ name, busy, onSubmit }: { name: string; busy: boolean; onSubmit: (liked: string, qs: string[]) => void }) {
  const [liked, setLiked] = useState('');
  const [qs, setQs] = useState(['', '', '']);
  const filled = qs.map((q) => q.trim()).filter(Boolean);
  return (
    <View style={{ gap: space.lg }}>
      <Intro icon="party-popper" title="Dono ne haan kaha!" text={`Ab ${name} ko batao unme kya achha laga, aur 3 tak sawaal poochho. Jawab tabhi dikhenge jab dono poora kar lein.`} />
      <TextField label={`${name} mein aapko kya achha laga?`} value={liked} onChangeText={setLiked} multiline maxLength={500} />
      {qs.map((q, i) => (
        <TextField
          key={i}
          label={`Sawaal ${i + 1}${i > 0 ? ' (optional)' : ''}`}
          value={q}
          onChangeText={(t) => setQs(qs.map((x, j) => (j === i ? t : x)))}
          placeholder={i === 0 ? 'Jaise: Tumhara dream weekend kaisa hai?' : ''}
          maxLength={200}
        />
      ))}
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>
        Respectful sawaal poochho. Galat ya bahut personal sawaal report ho sakte hain.
      </Text>
      <Button title="Bhejo" loading={busy} disabled={!liked.trim() || filled.length === 0} onPress={() => onSubmit(liked.trim(), filled)} />
    </View>
  );
}

function AnswerStep({ name, questions, busy, onSubmit }: {
  name: string;
  questions: DateQuestionView[];
  busy: boolean;
  onSubmit: (answers: { questionId: number; answer: string | null; skip: boolean }[]) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [skipped, setSkipped] = useState<Record<number, boolean>>({});
  const ready = questions.every((q) => skipped[q.id] || (answers[q.id] ?? '').trim());
  return (
    <View style={{ gap: space.lg }}>
      <Intro icon="comment-question-outline" title={`${name} jaanna chahte hain`} text="Jo sawaal theek na lage use skip kar sakte ho." />
      {questions.map((q) => (
        <View key={q.id} style={{ gap: space.sm }}>
          <Text style={s.question}>{q.question}</Text>
          {!skipped[q.id] ? (
            <TextField value={answers[q.id] ?? ''} onChangeText={(t) => setAnswers({ ...answers, [q.id]: t })} multiline maxLength={500} placeholder="Aapka jawab…" />
          ) : null}
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: !!skipped[q.id] }} onPress={() => setSkipped({ ...skipped, [q.id]: !skipped[q.id] })}>
            <Text style={{ fontFamily: fonts.bodySemi, color: colors.accentDark }}>{skipped[q.id] ? 'Jawab dena hai' : 'Skip karo'}</Text>
          </Pressable>
        </View>
      ))}
      <Button
        title="Jawab bhejo"
        loading={busy}
        disabled={!ready}
        onPress={() => onSubmit(questions.map((q) => ({ questionId: q.id, answer: skipped[q.id] ? null : (answers[q.id] ?? '').trim(), skip: !!skipped[q.id] })))}
      />
    </View>
  );
}

function Card({ label, text, highlight = false }: { label: string; text: string; highlight?: boolean }) {
  return (
    <View style={[s.card, highlight && { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }]}>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={s.cardText}>{text}</Text>
    </View>
  );
}

function QA({ q }: { q: DateQuestionView }) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{q.question}</Text>
      <Text style={[s.cardText, q.skipped && { color: colors.textMuted, fontStyle: 'italic' }]}>
        {q.skipped ? 'Skip kiya' : q.answer}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  question: { fontFamily: fonts.serifMedium, fontSize: 19, color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: 6 },
  cardLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textMuted },
  cardText: { fontFamily: fonts.serifMedium, fontSize: 18, lineHeight: 26, color: colors.text },
  planBox: { backgroundColor: colors.chip, borderRadius: radius.md, padding: space.lg, gap: 4 },
  planTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.text, marginBottom: space.sm },
  planText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  bullet: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.text },
});
