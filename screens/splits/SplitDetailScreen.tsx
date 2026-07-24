import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  Banner,
  Button,
  Card,
  EmptyState,
  Screen,
  SummaryRow,
} from "../../components";
import { useSavedSplits } from "../../contexts/SavedSplitsContext";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { SplitsStackParamList } from "../../navigation/types";
import { getSplitSession } from "../../services/splitSessionApi";
import { apiDtoToSplitSession } from "../../services/splitSessionMapper";
import type { SplitSession } from "../../types/split";
import { colors, fontSize, fontWeight, spacing } from "../../theme";
import { formatCurrency, formatSavedDate } from "../../utils/format";
import { MODE_LABELS } from "../../utils/labels";
import { formatSessionShareText } from "../../utils/splitCalculator";

type Props = NativeStackScreenProps<SplitsStackParamList, "SplitDetail">;

export default function SplitDetailScreen({ navigation, route }: Props) {
  const { sessionId } = route.params;
  const savedSplits = useSavedSplits();
  const draft = useSplitDraft();

  const cachedSession = savedSplits.sessions.find(
    (candidate) => candidate.id === sessionId,
  );
  const [session, setSession] = useState<SplitSession | null>(
    cachedSession ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  // The list endpoint already returns full sessions, so the cached copy is
  // rendered immediately and this only fills the gap on a cold deep link.
  useEffect(() => {
    if (cachedSession) {
      setSession(cachedSession);
      return;
    }

    let isActive = true;

    async function loadSession() {
      try {
        const dto = await getSplitSession(sessionId);
        if (isActive) {
          setSession(apiDtoToSplitSession(dto));
        }
      } catch (loadError) {
        console.error("[splitHistory] Failed to load split:", loadError);
        if (isActive) {
          setError("Could not load this split.");
        }
      }
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, [cachedSession, sessionId]);

  const shareSession = async () => {
    if (!session) {
      return;
    }

    try {
      await Share.share({
        message: formatSessionShareText(session),
        title: "Tably Results",
      });
    } catch {
      Alert.alert(
        "Unable to share",
        "Something went wrong while sharing results.",
      );
    }
  };

  const reopenInEditor = () => {
    if (!session) {
      return;
    }

    draft.loadSavedSplit(session);
    navigation.getParent()?.getParent()?.navigate("NewSplit", {
      screen: "ModeStep",
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete this split?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await savedSplits.remove(sessionId);
              navigation.goBack();
            } catch {
              setError("Could not delete saved split.");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (error) {
    return (
      <Screen>
        <Banner tone="error" message={error} />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <EmptyState
          icon="hourglass-outline"
          title="Loading split"
          description="Fetching the details for this split."
        />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <>
          <Button
            title="Share"
            icon="share-outline"
            onPress={() => void shareSession()}
          />
          <Button
            title="Reopen in editor"
            icon="create-outline"
            variant="outline"
            onPress={reopenInEditor}
          />
          <Button
            title="Delete Split"
            icon="trash-outline"
            variant="danger"
            onPress={confirmDelete}
          />
        </>
      }
    >
      <View style={styles.hero}>
        <Text style={styles.title}>
          {session.title || session.restaurantName || "Untitled split"}
        </Text>
        <Text style={styles.meta}>
          {formatSavedDate(session.createdAt)} · {MODE_LABELS[session.mode]} ·{" "}
          {session.people.length}{" "}
          {session.people.length === 1 ? "person" : "people"}
        </Text>
        <Text style={styles.total}>
          {formatCurrency(session.summary.finalTotal)}
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Receipt Summary</Text>
        <SummaryRow
          label="Subtotal"
          value={formatCurrency(session.summary.subtotal)}
        />
        <SummaryRow label="Tax" value={formatCurrency(session.summary.tax)} />
        <SummaryRow label="Tip" value={formatCurrency(session.summary.tip)} />
        <SummaryRow
          label="Final total"
          value={formatCurrency(session.summary.finalTotal)}
          bold
        />
        <SummaryRow
          label="Difference"
          value={formatCurrency(session.summary.difference)}
          bold
          highlight={session.summary.difference === 0}
        />
      </Card>

      <Text style={styles.sectionTitle}>What each person owes</Text>

      {session.personTotals.map((person) => (
        <Card key={person.personId} style={styles.personCard}>
          <View style={styles.personHeader}>
            <Avatar name={person.name} />
            <Text style={styles.personName} numberOfLines={1}>
              {person.name}
            </Text>
            <Text style={styles.personAmount}>
              {formatCurrency(person.finalAmount)}
            </Text>
          </View>
          <View style={styles.personBreakdown}>
            <SummaryRow
              label="Food subtotal"
              value={formatCurrency(person.foodSubtotal)}
            />
            <SummaryRow
              label="Tax share"
              value={formatCurrency(person.taxShare)}
            />
            <SummaryRow
              label="Tip share"
              value={formatCurrency(person.tipShare)}
            />
          </View>
        </Card>
      ))}

      {session.items.length > 0 ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          {session.items.map((item) => (
            <SummaryRow
              key={item.id}
              label={item.name}
              value={formatCurrency(item.price)}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  total: {
    color: colors.accent,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
    marginTop: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  personCard: {
    marginBottom: spacing.md,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  personName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  personAmount: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  personBreakdown: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
