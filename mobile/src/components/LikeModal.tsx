import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, space } from '../theme';
import { Button, TextField } from './ui';

/**
 * Bottom sheet that opens when you like a photo or prompt.
 * You can add a short comment (optional) — it shows up in their Likes tab.
 */
export function LikeModal({ visible, target, name, onClose, onSend }: {
  visible: boolean;
  target: string | null;
  name: string;
  onClose: () => void;
  onSend: (comment: string) => Promise<void>;
}) {
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) setComment('');
  }, [visible]);

  async function send() {
    setSending(true);
    try {
      await onSend(comment.trim());
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <Text style={s.title}>{name} ko like karo</Text>
          {target ? <Text style={s.target}>Aapne like kiya: {target}</Text> : null}
          <TextField value={comment} onChangeText={setComment} placeholder="Ek chhota sa comment (optional)" maxLength={200} multiline />
          <Button title="Like bhejo" onPress={send} loading={sending} />
          <Button title="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(42,29,23,0.35)' },
  sheet: {
    backgroundColor: colors.background, padding: space.xl, gap: space.md,
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
  },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  target: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
