import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen, StepIndicator } from "../../components";
import { colors, fontSize, fontWeight, lineHeight, spacing } from "../../theme";

export type WizardStepKey =
  | "receipt"
  | "mode"
  | "people"
  | "items"
  | "total"
  | "taxtip";

const WIZARD_STEPS: { key: WizardStepKey; label: string }[] = [
  { key: "receipt", label: "Receipt" },
  { key: "mode", label: "Mode" },
  { key: "people", label: "People" },
  { key: "items", label: "Items" },
  { key: "taxtip", label: "Tax & Tip" },
];

type WizardStepProps = {
  stepKey: WizardStepKey;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function WizardStep({
  stepKey,
  title,
  subtitle,
  children,
  footer,
}: WizardStepProps) {
  const currentIndex = Math.max(
    WIZARD_STEPS.findIndex((step) => step.key === stepKey),
    0,
  );

  return (
    <Screen footer={footer}>
      <StepIndicator
        steps={WIZARD_STEPS.map((step) => step.label)}
        currentIndex={currentIndex}
      />
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    marginTop: spacing.xs + 2,
  },
});
