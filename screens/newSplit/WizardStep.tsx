import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen, StepIndicator } from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { SplitMode } from "../../types/split";
import { colors, fontSize, fontWeight, lineHeight, spacing } from "../../theme";

export type WizardStepKey =
  | "receipt"
  | "mode"
  | "people"
  | "items"
  | "total"
  | "taxtip";

const EVEN_STEPS: { key: WizardStepKey; label: string }[] = [
  { key: "receipt", label: "Receipt" },
  { key: "mode", label: "Mode" },
  { key: "people", label: "People" },
  { key: "total", label: "Total" },
];

const SPLIT_BY_ITEM_STEPS: { key: WizardStepKey; label: string }[] = [
  { key: "receipt", label: "Receipt" },
  { key: "mode", label: "Mode" },
  { key: "people", label: "People" },
  { key: "items", label: "Items" },
  { key: "taxtip", label: "Tax & Tip" },
];

/**
 * Even splits never ask for items or tax and tip, so the indicator shows four
 * steps there and five for the itemized and hybrid flows.
 */
export function stepsForMode(mode: SplitMode) {
  return mode === "even" ? EVEN_STEPS : SPLIT_BY_ITEM_STEPS;
}

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
  const { mode } = useSplitDraft();
  const steps = stepsForMode(mode);
  const currentIndex = Math.max(
    steps.findIndex((step) => step.key === stepKey),
    0,
  );

  return (
    <Screen footer={footer}>
      <StepIndicator
        steps={steps.map((step) => step.label)}
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
