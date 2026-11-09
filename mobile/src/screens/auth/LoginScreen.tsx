import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { authApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { confirmOtp, sendOtp, signInWithGoogle } from '../../auth/firebaseAuth';
import { Button, ErrorText, Screen, Subtitle, TextField, Title } from '../../components/ui';
import { config } from '../../config';
import { colors, fonts, space } from '../../theme';

/**
 * Phone OTP (Firebase) or Google login. Either way we end up with a Firebase ID token,
 * swap it for our JWT at /api/auth/firebase, and AuthContext takes over from there.
 */
export function LoginScreen() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState<'otp' | 'verify' | 'google' | 'dev' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = '+91' + phone.replace(/\D/g, '').slice(-10);

  async function run(kind: typeof loading, fn: () => Promise<void>) {
    setError(null);
    setLoading(kind);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message ?? 'Kuch gadbad ho gayi');
    } finally {
      setLoading(null);
    }
  }

  const onSendOtp = () => run('otp', async () => {
    if (fullPhone.length !== 13) throw new Error('10 digit mobile number daalo');
    await sendOtp(fullPhone);
    setOtpSent(true);
  });

  const onVerify = () => run('verify', async () => {
    const idToken = await confirmOtp(otp.trim());
    await signIn(await authApi.firebase(idToken));
  });

  const onGoogle = () => run('google', async () => {
    const idToken = await signInWithGoogle();
    if (idToken) await signIn(await authApi.firebase(idToken));
  });

  const onDevLogin = () => run('dev', async () => {
    if (fullPhone.length !== 13) throw new Error('10 digit mobile number daalo');
    await signIn(await authApi.devLogin(fullPhone));
  });

  return (
    <Screen scroll>
      <View style={{ gap: space.xl }}>
        <View>
          <Title>{otpSent ? 'OTP daalo' : 'Aapka number?'}</Title>
          <Subtitle>{otpSent ? `${fullPhone} pe 6 digit code bheja hai.` : 'Hum ek OTP bhejenge. Number kisi ko dikhaya nahi jayega.'}</Subtitle>
        </View>

        {!otpSent ? (
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' }}>
            <View style={{ width: 70 }}>
              <TextField value="+91" editable={false} accessibilityLabel="Country code" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="98765 43210"
                maxLength={11}
                accessibilityLabel="Mobile number"
              />
            </View>
          </View>
        ) : (
          <TextField
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            placeholder="123456"
            maxLength={6}
            accessibilityLabel="OTP"
          />
        )}

        <ErrorText message={error} />

        {!otpSent ? (
          <Button title="OTP bhejo" onPress={onSendOtp} loading={loading === 'otp'} />
        ) : (
          <View style={{ gap: space.sm }}>
            <Button title="Verify" onPress={onVerify} loading={loading === 'verify'} disabled={otp.length !== 6} />
            <Button title="Number badlo" variant="ghost" onPress={() => { setOtpSent(false); setOtp(''); }} />
          </View>
        )}

        <Text style={{ textAlign: 'center', fontFamily: fonts.body, color: colors.textMuted }}>ya</Text>

        <Button title="Google se continue karo" variant="secondary" onPress={onGoogle} loading={loading === 'google'} />

        {config.devLogin ? (
          <Button title="Dev login (testing)" variant="ghost" onPress={onDevLogin} loading={loading === 'dev'} />
        ) : null}
      </View>
    </Screen>
  );
}
