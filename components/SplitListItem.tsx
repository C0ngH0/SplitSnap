import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, fontWeight, spacing, typography } from "../theme";
import { formatCurrency, formatSavedDate } from "../utils/format";
import type { SplitSession } from "../types/split";
import { ListCard } from "./ListCard";

type SplitListItemProps = {
  session: SplitSession;
  onPress: () => void;
};

export function SplitListItem({ session, onPress }: SplitListItemProps) {
  const title = session.title || session.restaurantName || "Untitled split";

  return (
    <ListCard
      onPress={onPress}
      accessibilityLabel={`${title}, ${formatCurrency(session.summary.finalTotal)}`}
    >
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
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
      </View>
    </ListCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  meta: {
    ...typography.caption,
  },
  total: {
    color: colors.accent,
    fontSize: typography.section.fontSize,
    fontWeight: fontWeight.bold,
  },
});
