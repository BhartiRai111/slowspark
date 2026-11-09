import React, { useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { meApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { Button, Label, Screen, Subtitle } from '../../components/ui';
import { config } from '../../config';
import { space } from '../../theme';

/** Settings: legal links, contact, logout and permanent account deletion (Play Store requirement). */
export function SettingsScreen() {
  const { me, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    Alert.alert(
      'Account delete karein?',
      'Aapki profile, photos, matches aur saari chats hamesha ke liye mit jayengi. Ye wapas nahi hoga.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await meApi.delete();
              await signOut();
            } catch (e: any) {
              setDeleting(false);
              Alert.alert('Delete nahi ho paaya', e.message);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen scroll>
      <View style={{ gap: space.xl }}>
        <View>
          <Label>Account</Label>
          <Subtitle>{me?.phone ?? me?.email ?? ''}</Subtitle>
        </View>
        <View style={{ gap: space.md }}>
          {config.privacyPolicyUrl ? (
            <Button title="Privacy Policy" variant="secondary" onPress={() => Linking.openURL(config.privacyPolicyUrl)} />
          ) : null}
          {config.termsUrl ? (
            <Button title="Terms of Use" variant="secondary" onPress={() => Linking.openURL(config.termsUrl)} />
          ) : null}
          {config.supportEmail ? (
            <Button title="Help & support" variant="secondary" onPress={() => Linking.openURL(`mailto:${config.supportEmail}`)} />
          ) : null}
        </View>
        <Button title="Log out" variant="secondary" onPress={signOut} />
        <Button title="Account delete karo" variant="danger" loading={deleting} onPress={confirmDelete} />
      </View>
    </Screen>
  );
}
