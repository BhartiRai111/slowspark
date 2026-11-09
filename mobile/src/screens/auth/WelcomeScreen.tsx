import React from 'react';
import { Text, View } from 'react-native';
import { Button, Logo, Screen, Subtitle, Title } from '../../components/ui';
import type { ScreenProps } from '../../navigation/types';
import { colors, fonts, space } from '../../theme';

export function WelcomeScreen({ navigation }: ScreenProps<'Welcome'>) {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xl }}>
        <Logo size={34} />
        <View>
          <Title style={{ fontSize: 40, lineHeight: 48 }}>Pehle jaano,{'\n'}phir milo.</Title>
          <Subtitle>
            SlowSpark un logon ke liye hai jo swipe se zyada baat-cheet mein yakeen rakhte hain.
          </Subtitle>
        </View>
      </View>
      <View style={{ gap: space.md }}>
        <Button title="Get started" onPress={() => navigation.navigate('Login')} />
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
          Aage badhkar aap confirm karte ho ki aapki umar 18+ hai aur aap hamari Terms aur Privacy Policy maante ho.
        </Text>
      </View>
    </Screen>
  );
}
