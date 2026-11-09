import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { safetyApi } from '../../api/endpoints';
import type { ReportReason } from '../../api/types';
import { Button, ChipSelect, ErrorText, Label, Screen, Subtitle, TextField, Title } from '../../components/ui';
import { REPORT_REASON_LABELS } from '../../lib/labels';
import type { ScreenProps } from '../../navigation/types';
import { space } from '../../theme';

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

/** Report (always also blocks) or just block someone. Both end any match with them. */
export function ReportScreen({ navigation, route }: ScreenProps<'Report'>) {
  const { userId, name } = route.params;
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState<'report' | 'block' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function done(message: string) {
    Alert.alert('Ho gaya', message);
    navigation.popToTop();
  }

  async function report() {
    if (!reason) return setError('Ek wajah chuno');
    setBusy('report');
    setError(null);
    try {
      await safetyApi.report(userId, reason, details.trim() || undefined);
      done(`Shukriya. ${name} block ho gaye hain aur hamari team report dekhegi.`);
    } catch (e: any) {
      setError(e.message);
      setBusy(null);
    }
  }

  async function block() {
    setBusy('block');
    setError(null);
    try {
      await safetyApi.block(userId);
      done(`${name} block ho gaye. Ab aap ek dusre ko nahi dikhoge.`);
    } catch (e: any) {
      setError(e.message);
      setBusy(null);
    }
  }

  return (
    <Screen scroll>
      <View style={{ gap: space.xl }}>
        <View>
          <Title>{name} ko report karo</Title>
          <Subtitle>Report private hai. {name} ko pata nahi chalega kisne report kiya.</Subtitle>
        </View>
        <View style={{ gap: space.sm }}>
          <Label>Kya hua?</Label>
          <ChipSelect options={REASONS} value={reason} onChange={setReason} labels={REPORT_REASON_LABELS} />
        </View>
        <TextField label="Aur kuch batana hai? (optional)" value={details} onChangeText={setDetails} multiline maxLength={1000} />
        <ErrorText message={error} />
        <Button title="Report bhejo" onPress={report} loading={busy === 'report'} disabled={busy !== null} />
        <Button title="Sirf block karo" variant="secondary" onPress={block} loading={busy === 'block'} disabled={busy !== null} />
      </View>
    </Screen>
  );
}
