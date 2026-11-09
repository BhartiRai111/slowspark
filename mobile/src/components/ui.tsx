import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, space } from '../theme';

// Small building blocks used on every screen, all in the Warm Ember style.

export function Screen({ children, scroll = false, padded = true }: {
  children: React.ReactNode; scroll?: boolean; padded?: boolean;
}) {
  const inner = padded ? { padding: space.lg } : undefined;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={[inner, { paddingBottom: 48 }]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Subtitle({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <MaterialCommunityIcons name="fire" size={size + 2} color={colors.accent} />
      <Text style={[styles.logoText, { fontSize: size }]}>SlowSpark</Text>
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  const bg = variant === 'primary' ? colors.accent : variant === 'secondary' ? colors.surface : 'transparent';
  const fg = variant === 'primary' ? colors.white : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.borderStrong },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function TextField({ label, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, props.style]} />
    </View>
  );
}

export function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, selected && { backgroundColor: colors.accent }]}
    >
      <Text style={[styles.chipText, selected && { color: colors.white, fontFamily: fonts.bodySemi }]}>{label}</Text>
    </Pressable>
  );
}

/** A row of chips. Single select returns one value (tap again to clear); multi select returns a list. */
export function ChipSelect<T extends string | number>({ options, value, onChange, labels }: {
  options: readonly T[];
  value: T | null | undefined;
  onChange: (v: T | null) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <Chip key={String(o)} label={labels?.[o] ?? String(o)} selected={value === o} onPress={() => onChange(value === o ? null : o)} />
      ))}
    </View>
  );
}

export function MultiChipSelect<T extends string | number>({ options, value, onChange, max, labels }: {
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  max?: number;
  labels?: Partial<Record<T, string>>;
}) {
  const toggle = (o: T) => {
    if (value.includes(o)) onChange(value.filter((v) => v !== o));
    else if (!max || value.length < max) onChange([...value, o]);
  };
  return (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <Chip key={String(o)} label={labels?.[o] ?? String(o)} selected={value.includes(o)} onPress={() => toggle(o)} />
      ))}
    </View>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={[styles.center, { padding: space.xl }]}>
      <MaterialCommunityIcons name="fire" size={40} color={colors.accent} />
      <Text style={[styles.title, { fontSize: 24, textAlign: 'center', marginTop: space.md }]}>{title}</Text>
      <Text style={[styles.subtitle, { textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}

export function IconButton({ icon, label, onPress, size = 52, filled = false }: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  size?: number;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2, opacity: pressed ? 0.8 : 1 },
        filled && { backgroundColor: colors.accent, borderColor: colors.accent },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={size * 0.45} color={filled ? colors.white : colors.accent} />
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, lineHeight: 22, marginTop: space.xs },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textMuted },
  logoText: { fontFamily: fonts.serif, color: colors.text, letterSpacing: -0.3 },
  button: { height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  buttonText: { fontFamily: fonts.bodySemi, fontSize: 16 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: space.lg, paddingVertical: 14, fontFamily: fonts.body, fontSize: 16, color: colors.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { backgroundColor: colors.chip, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill },
  chipText: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
  error: { fontFamily: fonts.bodyMedium, color: colors.danger, fontSize: 14 },
  iconButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
});
