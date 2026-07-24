import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fontSize, fontWeight, radius, spacing } from "../theme";
import { formatCurrency, formatSavedDate } from "../utils/format";
import type { SplitSession } from "../types/split";

type SplitListItemProps = {
  session: SplitSession;
  onPress: () => void;
};

export function SplitListItem({ session, onPress }: SplitListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.iconBox}>
        <Ionicons
          name="restaurant-outline"
          size={18}
          color={colors.primaryInfo}
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {session.title || session.restaurantName || "Untitled split"}
        </Text>
        <Text style={styles.meta}>
          {formatSavedDate(session.createdAt)} · {session.people.length}{" "}
          {session.people.length === 1 ? "person" : "people"}
        </Text>
      </View>
      <Text style={styles.total}>
        {formatCurrency(session.summary.finalTotal)}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSunken,
  },
  text: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs / 2,
  },
  total: {
    color: colors.accent,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
