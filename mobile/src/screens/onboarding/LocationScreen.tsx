import * as Location from 'expo-location';
import React, { useState } from 'react';
import { View } from 'react-native';
import { meApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { Button, ErrorText, Screen, Subtitle, Title } from '../../components/ui';
import { space } from '../../theme';

/**
 * Onboarding step 5: location (for "people near you"), then finish onboarding.
 * City and state are filled automatically from the phone's location.
 */
export function LocationScreen() {
  const { refreshMe } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function allowAndFinish() {
    setError(null);
    setLoading(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        throw new Error('Location ke bina aas-paas ke log nahi dikha sakte. Settings se allow karo.');
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let city: string | undefined;
      let state: string | undefined;
      try {
        const [place] = await Location.reverseGeocodeAsync(pos.coords);
        city = place?.city ?? place?.subregion ?? undefined;
        state = place?.region ?? undefined;
      } catch {
        // city/state are nice to have; continue without them
      }
      await meApi.location({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, city, state });
      await meApi.complete();
      await refreshMe(); // status becomes "ready" → main app opens
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.lg }}>
        <Title>Aap kahan ho?</Title>
        <Subtitle>
          Hum sirf aapka shehar aur doori (jaise "3 km") dikhate hain, exact location kabhi nahi.
        </Subtitle>
      </View>
      <View style={{ gap: space.md }}>
        <ErrorText message={error} />
        <Button title="Location allow karo aur shuru karo" onPress={allowAndFinish} loading={loading} />
      </View>
    </Screen>
  );
}
