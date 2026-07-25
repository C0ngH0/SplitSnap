import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RefreshControl, StyleSheet, Text, View } from "react-native";

import {
  Banner,
  EmptyState,
  ListCard,
  Screen,
  SectionHeader,
} from "../../components";
import { SplitListItem } from "../../components/SplitListItem";
import { useAuth } from "../../contexts/AuthContext";
import { useSavedSplits } from "../../contexts/SavedSplitsContext";
import type { SplitsStackParamList } from "../../navigation/types";
import { colors, fontWeight, spacing, typography } from "../../theme";
import { formatCurrency } from "../../utils/format";

type Props = NativeStackScreenProps<SplitsStackParamList, "SplitsList">;

export default function SplitsScreen({ navigation }: Props) {
  const { authToken, isGuest, exitGuest } = useAuth();
  const savedSplits = useSavedSplits();

  if (!authToken) {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to see your splits"
          description="Saved splits are tied to your account so you can pick them up on any device."
          actionLabel={isGuest ? "Sign in" : undefined}
          onAction={isGuest ? () => void exitGuest() : undefined}
        />
      </Screen>
    );
  }

  const combinedTotal = savedSplits.sessions.reduce(
    (sum, session) => sum + session.summary.finalTotal,
    0,
  );
  const splitCount = savedSplits.sessions.length;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={savedSplits.isLoading}
          onRefresh={() => void savedSplits.refresh()}
          tintColor={colors.textMuted}
        />
      }
    >
      {savedSplits.error ? (
        <Banner tone="error" message={savedSplits.error} />
      ) : null}

      {splitCount === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="No saved splits yet"
          description="Once you save a split it will show up here, with the full breakdown for everyone."
        />
      ) : (
        <>
          <SectionHeader title="Your splits" style={styles.sectionHeader} />

          <ListCard style={styles.summaryCard}>
            <View style={styles.summary}>
              <View>
                <Text style={styles.summaryLabel}>Saved</Text>
                <Text style={styles.summaryValue}>
                  {splitCount} {splitCount === 1 ? "split" : "splits"}
                </Text>
              </View>
              <View style={styles.summaryTotalBlock}>
                <Text style={styles.summaryLabel}>Combined</Text>
                <Text style={styles.summaryTotal}>
                  {formatCurrency(combinedTotal)}
                </Text>
              </View>
            </View>
          </ListCard>

          <View style={styles.list}>
            {savedSplits.sessions.map((session) => (
              <SplitListItem
                key={session.id}
                session={session}
                onPress={() =>
                  navigation.navigate("SplitDetail", {
                    sessionId: session.id,
                  })
                }
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: spacing.md,
  },
  summaryCard: {
    marginBottom: spacing.lg,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  summaryLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.section,
  },
  summaryTotalBlock: {
    alignItems: "flex-end",
  },
  summaryTotal: {
    color: colors.accent,
    fontSize: typography.section.fontSize,
    fontWeight: fontWeight.bold,
    lineHeight: typography.section.lineHeight,
  },
  list: {
    gap: spacing.md,
  },
});
