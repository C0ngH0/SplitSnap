import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RefreshControl, StyleSheet, Text, View } from "react-native";

import { Banner, EmptyState, Screen } from "../../components";
import { SplitListItem } from "../../components/SplitListItem";
import { useAuth } from "../../contexts/AuthContext";
import { useSavedSplits } from "../../contexts/SavedSplitsContext";
import type { SplitsStackParamList } from "../../navigation/types";
import { colors, fontSize, spacing } from "../../theme";
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

      {savedSplits.sessions.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="No saved splits yet"
          description="Once you save a split it will show up here, with the full breakdown for everyone."
        />
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {savedSplits.sessions.length}{" "}
              {savedSplits.sessions.length === 1 ? "split" : "splits"}
            </Text>
            <Text style={styles.summaryTotal}>
              {formatCurrency(combinedTotal)} total
            </Text>
          </View>

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
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  summaryTotal: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  list: {
    gap: spacing.sm,
  },
});
