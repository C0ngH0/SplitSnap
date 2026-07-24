import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fontSize, fontWeight, lineHeight, radius, spacing } from "../theme";

type SelectableOptionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  selected?: boolean;
  /** Renders a chevron instead of a checkmark, for navigation rows. */
  chevron?: boolean;
  onPress: () => void;
};

export function SelectableOption({
  icon,
  title,
  description,
  selected,
  chevron,
  onPress,
}: SelectableOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
        <Ionicons
          name={icon}
          size={20}
          color={selected ? colors.primaryText : colors.primaryInfo}
        />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, selected && styles.titleSelected]}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {chevron ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
        />
      ) : selected ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSunken,
  },
  containerSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  iconBoxSelected: {
    backgroundColor: colors.primary,
  },
  text: {
    flex: 1,
  },
  title: {
    color: colors.textBody,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  titleSelected: {
    color: colors.textPrimary,
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    marginTop: spacing.xs / 2,
  },
});
