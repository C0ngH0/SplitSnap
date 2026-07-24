import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  Banner,
  Button,
  Card,
  Screen,
  SummaryRow,
} from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, radius, spacing } from "../../theme";
import { formatCurrency } from "../../utils/format";
import { MODE_LABELS } from "../../utils/labels";

type Props = NativeStackScreenProps<NewSplitStackParamList, "Results">;

export default function ResultsScreen({ navigation }: Props) {
  const draft = useSplitDraft();
  const { authToken, isGuest, exitGuest } = useAuth();
  const session = draft.session;

  const closeWizard = () => {
    draft.reset();
    navigation.getParent()?.dispatch(
      CommonActions.navigate({ name: "Main" }),
    );
  };

  if (!session) {
    return (
      <Screen>
        <Banner
          tone="info"
          message="Nothing calculated yet. Go back and finish the split."
        />
      </Screen>
    );
  }

  const isBalanced = session.summary.difference === 0;

  return (
    <Screen
      footer={
        <>
          {authToken ? (
            <Button
              title="Save Split"
              icon="bookmark-outline"
              variant="accent"
              size="lg"
              onPress={() => void draft.saveCurrentSplit()}
            />
          ) : (
            <Button
              title="Sign in to save"
              icon="log-in-outline"
              variant="outline"
              onPress={() => {
                if (isGuest) {
                  void exitGuest();
                }
              }}
            />
          )}
          <Button title="Done" variant="ghost" onPress={closeWizard} />
        </>
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons
            name="checkmark-circle"
            size={30}
            color={colors.accent}
          />
        </View>
        <Text style={styles.heroTitle}>
          {formatCurrency(session.summary.finalTotal)}
        </Text>
        <Text style={styles.heroSubtitle}>
          {MODE_LABELS[session.mode]} · {session.people.length} people
        </Text>
      </View>

      {draft.savedStatus ? (
        <Banner tone="success" message={draft.savedStatus} />
      ) : null}
      {draft.error ? <Banner tone="error" message={draft.error} /> : null}
      {isGuest && !authToken ? (
        <Banner
          tone="info"
          message="You are using Tably as a guest. Sign in to keep this split."
        />
      ) : null}

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Receipt Summary</Text>
          <Button
            title="Share"
            icon="share-outline"
            variant="outline"
            onPress={() => void draft.shareResults()}
          />
        </View>
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
          label="Sum of people totals"
          value={formatCurrency(session.summary.sumOfPeopleTotals)}
        />
        <SummaryRow
          label="Difference"
          value={formatCurrency(session.summary.difference)}
          bold
          highlight={isBalanced}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSurface,
    marginBottom: spacing.md,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
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
