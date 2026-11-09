import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActionSheetIOS, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dateApi, matchApi } from '../../api/endpoints';
import type { ChatMessage, DateStage } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import type { ScreenProps } from '../../navigation/types';
import { useRealtime } from '../../realtime/RealtimeContext';
import { colors, fonts, radius, space } from '../../theme';

const BANNER_TEXT: Partial<Record<DateStage, string>> = {
  AVAILABLE: 'Date pe chalein? Dekho kya sochte ho',
  WAITING: 'Aapne jawab de diya hai',
  FORM: 'Dono ne haan kaha! Apna form bharo',
  ANSWER: 'Aapke liye sawaal aaye hain',
  WAITING_FOR_THEM: 'Unke jawab ka intezaar',
  REVEALED: 'Jawab aa gaye! Dekho',
};

/** One conversation. Messages arrive live over WebSocket; sending uses REST. */
export function ChatScreen({ navigation, route }: ScreenProps<'Chat'>) {
  const { matchId, userId, name } = route.params;
  const { me } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]); // newest first (inverted list)
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [dateStage, setDateStage] = useState<DateStage>('LOCKED');
  const [hasMore, setHasMore] = useState(true);

  const loadDate = useCallback(() => {
    dateApi.view(matchId).then((v) => setDateStage(v.stage)).catch(() => {});
  }, [matchId]);

  useEffect(() => {
    matchApi.messages(matchId).then((list) => {
      setMessages(list);
      setHasMore(list.length >= 30);
    }).catch(() => {});
    matchApi.markRead(matchId).catch(() => {});
    loadDate();
  }, [matchId, loadDate]);

  useRealtime((e) => {
    if (e.type === 'NEW_MESSAGE' && e.data.matchId === matchId) {
      const msg = e.data as ChatMessage;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]));
      if (msg.senderId !== me?.id) matchApi.markRead(matchId).catch(() => {});
      loadDate(); // message count can unlock Date Ready
    } else if (e.type === 'DATE_UPDATE' && e.data.matchId === matchId) {
      loadDate();
    } else if (e.type === 'UNMATCHED' && e.data.matchId === matchId) {
      Alert.alert('Match khatam', `${name} ab available nahi hai.`);
      navigation.goBack();
    }
  });

  async function loadOlder() {
    if (!hasMore || messages.length === 0) return;
    const older = await matchApi.messages(matchId, messages[messages.length - 1].id).catch(() => []);
    setHasMore(older.length >= 30);
    setMessages((prev) => [...prev, ...older]);
  }

  async function send() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      const msg = await matchApi.send(matchId, content);
      setText('');
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]));
    } catch (e: any) {
      Alert.alert('Message nahi gaya', e.message);
    } finally {
      setSending(false);
    }
  }

  const openMenu = useCallback(() => {
    const actions = [
      { label: 'Profile dekho', run: () => navigation.navigate('ViewProfile', { userId }) },
      { label: 'Report / block', run: () => navigation.navigate('Report', { userId, name, matchId }) },
      {
        label: 'Unmatch',
        run: () => Alert.alert('Unmatch?', `${name} ke saath chat hamesha ke liye hat jayegi.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unmatch', style: 'destructive', onPress: async () => { await matchApi.unmatch(matchId).catch(() => {}); navigation.goBack(); } },
        ]),
      },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...actions.map((a) => a.label), 'Cancel'], cancelButtonIndex: actions.length, destructiveButtonIndex: 2 },
        (i) => actions[i]?.run(),
      );
    } else {
      Alert.alert(name, undefined, [...actions.map((a) => ({ text: a.label, onPress: a.run })), { text: 'Cancel', style: 'cancel' as const }]);
    }
  }, [navigation, userId, name, matchId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name,
      headerRight: () => (
        <Pressable accessibilityRole="button" accessibilityLabel="Chat options" onPress={openMenu} hitSlop={12}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, name, openMenu]);

  const banner = BANNER_TEXT[dateStage];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {banner ? (
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('DateReady', { matchId, name })} style={s.banner}>
            <MaterialCommunityIcons name="fire" size={20} color={colors.accent} />
            <Text style={s.bannerText}>{banner}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.accentDark} />
          </Pressable>
        ) : null}

        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => String(m.id)}
          onEndReached={loadOlder}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ padding: space.lg, gap: space.sm }}
          ListEmptyComponent={
            <Text style={s.empty}>Pehla message bhejo. Unki profile se kuch poochho!</Text>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === me?.id;
            return (
              <View style={[s.bubble, mine ? s.mine : s.theirs]}>
                <Text style={[s.msgText, mine && { color: colors.white }]}>{item.content}</Text>
              </View>
            );
          }}
        />

        <View style={s.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message likho…"
            placeholderTextColor={colors.textMuted}
            style={s.input}
            multiline
            maxLength={2000}
            accessibilityLabel="Message"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={send}
            disabled={sending || !text.trim()}
            style={[s.send, (sending || !text.trim()) && { opacity: 0.5 }]}
          >
            <MaterialCommunityIcons name="send" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm, marginHorizontal: space.lg, marginTop: space.sm,
    padding: space.md, borderRadius: radius.sm, backgroundColor: colors.accentSoft,
  },
  bannerText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: colors.accentDark },
  empty: { fontFamily: fonts.body, color: colors.textMuted, textAlign: 'center', transform: [{ scaleY: -1 }], marginTop: space.xl },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  msgText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, padding: space.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  input: {
    flex: 1, maxHeight: 120, backgroundColor: colors.background, borderRadius: 22, paddingHorizontal: space.lg,
    paddingVertical: 10, fontFamily: fonts.body, fontSize: 15, color: colors.text,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
