import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, fontSize, fontWeight, lineHeight, radius, spacing } from "../theme";

type CardProps = {
  children?: ReactNode;
  title?: string;
  hint?: string;
  /** Inset variant for cards nested inside another card. */
  sunken?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, title, hint, sunken, style }: CardProps) {
  return (
    <View style={[sunken ? styles.sunken : styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  sunken: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
});
