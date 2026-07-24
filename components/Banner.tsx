import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, lineHeight, radius, spacing } from "../theme";

type BannerTone = "error" | "success" | "warning" | "info";

type BannerProps = {
  tone: BannerTone;
  title?: string;
  message?: string;
  children?: ReactNode;
};

export function Banner({ tone, title, message, children }: BannerProps) {
  const palette = PALETTES[tone];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.background, borderColor: palette.border },
      ]}
      accessibilityRole={tone === "error" ? "alert" : "text"}
    >
      {title ? (
        <Text style={[styles.title, { color: palette.title }]}>{title}</Text>
      ) : null}
      {message ? (
        <Text style={[styles.message, { color: palette.text }]}>{message}</Text>
      ) : null}
      {children}
    </View>
  );
}

const PALETTES: Record<
  BannerTone,
  { background: string; border: string; title: string; text: string }
> = {
  error: {
    background: colors.dangerSurface,
    border: colors.dangerBorder,
    title: colors.dangerText,
    text: colors.dangerText,
  },
  success: {
    background: colors.accentSurface,
    border: colors.accent,
    title: colors.accentSurfaceText,
    text: colors.accentSurfaceText,
  },
  warning: {
    background: colors.warningSurface,
    border: colors.warningBorder,
    title: colors.warningTitle,
    text: colors.warningText,
  },
  info: {
    background: colors.primarySurface,
    border: colors.primary,
    title: colors.primaryInfo,
    text: colors.primaryInfo,
  },
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs + 2,
  },
  message: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
});
