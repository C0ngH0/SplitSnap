import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fontSize, fontWeight, radius, spacing } from "../theme";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
};

export function QuantityStepper({
  value,
  min = 0,
  max = 99,
  onChange,
  label,
}: Props) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View style={styles.row}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, !canDecrement && styles.buttonDisabled]}
          disabled={!canDecrement}
          onPress={() => onChange(value - 1)}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
          hitSlop={8}
        >
          <Ionicons
            name="remove"
            size={16}
            color={canDecrement ? colors.textPrimary : colors.textPlaceholder}
          />
        </TouchableOpacity>
        <Text style={styles.value}>{value}</Text>
        <TouchableOpacity
          style={[styles.button, !canIncrement && styles.buttonDisabled]}
          disabled={!canIncrement}
          onPress={() => onChange(value + 1)}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
          hitSlop={8}
        >
          <Ionicons
            name="add"
            size={16}
            color={canIncrement ? colors.textPrimary : colors.textPlaceholder}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: {
    flex: 1,
    color: colors.textBody,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  value: {
    minWidth: 24,
    textAlign: "center",
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
