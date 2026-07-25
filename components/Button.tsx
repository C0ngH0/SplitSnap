import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, fontSize, fontWeight, radius, spacing } from "../theme";

/**
 * Variants:
 * - primary: main action on a screen
 * - accent: money / success emphasis (use sparingly)
 * - outline / ghost: secondary / tertiary
 * - danger: destructive only
 */
type ButtonVariant = "primary" | "accent" | "outline" | "danger" | "ghost";
type ButtonSize = "md" | "lg";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  icon,
  style,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;
  const textColor = TEXT_COLORS[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        size === "lg" && styles.large,
        CONTAINERS[variant],
        !isInteractive && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      accessibilityLabel={title}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : icon ? (
          <Ionicons name={icon} size={18} color={textColor} />
        ) : null}
        <Text
          style={[
            styles.label,
            size === "lg" && styles.labelLarge,
            { color: textColor },
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const CONTAINERS: Record<ButtonVariant, StyleProp<ViewStyle>> = {
  primary: { backgroundColor: colors.primary },
  accent: { backgroundColor: colors.accent },
  outline: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  ghost: { backgroundColor: "transparent" },
};

const TEXT_COLORS: Record<ButtonVariant, string> = {
  primary: colors.primaryText,
  accent: colors.accentText,
  outline: colors.textSecondary,
  danger: colors.dangerText,
  ghost: colors.primaryLink,
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  large: {
    paddingVertical: spacing.lg,
    minHeight: 52,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  labelLarge: {
    fontSize: fontSize.lg,
  },
  disabled: {
    opacity: 0.5,
  },
});
