import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, spacing } from "../theme";

type SummaryRowProps = {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
};

export function SummaryRow({ label, value, bold, highlight }: SummaryRowProps) {
  return (
    <View style={styles.row}>
      <Text style={bold ? styles.labelBold : styles.label}>{label}</Text>
      <Text
        style={[
          bold ? styles.valueBold : styles.value,
          highlight && styles.valueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs + 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  value: {
    color: colors.textBody,
    fontSize: fontSize.md,
  },
  labelBold: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  valueBold: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  valueHighlight: {
    color: colors.accent,
  },
});
