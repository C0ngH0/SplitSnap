import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, spacing } from "../theme";

type StepIndicatorProps = {
  steps: string[];
  /** Zero-based index of the step currently on screen. */
  currentIndex: number;
};

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex]}`}
    >
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <Fragment key={step}>
            {index > 0 ? (
              <View
                style={[styles.connector, isComplete && styles.connectorDone]}
              />
            ) : null}
            <View style={styles.step}>
              <View
                style={[
                  styles.bubble,
                  isComplete && styles.bubbleComplete,
                  isCurrent && styles.bubbleCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    (isComplete || isCurrent) && styles.bubbleTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[styles.label, isCurrent && styles.labelCurrent]}
                numberOfLines={1}
              >
                {step}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  step: {
    alignItems: "center",
    width: 62,
  },
  bubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleComplete: {
    backgroundColor: colors.accentSurface,
    borderColor: colors.accent,
  },
  bubbleCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bubbleText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  bubbleTextActive: {
    color: colors.textPrimary,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs + 2,
  },
  labelCurrent: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  connector: {
    height: 1,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 14,
    marginHorizontal: -spacing.sm,
  },
  connectorDone: {
    backgroundColor: colors.accent,
  },
});
