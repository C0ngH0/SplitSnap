import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  Banner,
  Button,
  Card,
  ReceiptPreviewSection,
  Screen,
  SectionHeader,
  SummaryRow,
} from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import {
  SPLIT_SAVED_SUCCESS_MESSAGE,
  useSplitDraft,
} from "../../contexts/SplitDraftContext";
import { skipNextNewSplitDiscardConfirmation } from "../../navigation/newSplitDiscardGuard";
import type { NewSplitStackParamList } from "../../navigation/types";
import {
  colors,
  fontWeight,
  radius,
  spacing,
  typography,
} from "../../theme";
import { formatCurrency } from "../../utils/format";
import { MODE_LABELS } from "../../utils/labels";

type Props = NativeStackScreenProps<NewSplitStackParamList, "Results">;

export default function ResultsScreen({ navigation }: Props) {
  const draft = useSplitDraft();
  const { authToken, isGuest, beginAuthForSaveSplit } = useAuth();
  const session = draft.session;

  const closeWizard = () => {
    skipNextNewSplitDiscardConfirmation();
    draft.reset();
    navigation.getParent()?.goBack();
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
  const saveSucceeded = draft.savedStatus === SPLIT_SAVED_SUCCESS_MESSAGE;
  const saveButtonTitle = draft.isSaving
    ? "Saving..."
    : saveSucceeded
      ? "Saved"
      : "Save Split";
  const receiptImageUrl =
    session.receiptImageUrl ||
    draft.receiptImageUrl ||
    draft.receiptImageUri ||
    null;

  return (
    <Screen
      footer={
        <>
          {authToken ? (
            <Button
              title={saveButtonTitle}
              icon={saveSucceeded ? "checkmark-circle" : "bookmark-outline"}
              variant="primary"
              size="lg"
              loading={draft.isSaving}
              disabled={draft.isSaving || saveSucceeded}
              onPress={() => void draft.saveCurrentSplit()}
            />
          ) : (
            <Button
              title="Sign in to save"
              icon="log-in-outline"
              variant="primary"
              size="lg"
              onPress={() => {
                if (isGuest) {
                  beginAuthForSaveSplit();
                }
              }}
            />
          )}
          <Button
            title="Share"
            icon="share-outline"
            variant="outline"
            onPress={() => void draft.shareResults()}
          />
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

      <ReceiptPreviewSection imageUrl={receiptImageUrl} />

      <Card style={styles.card} title="Receipt Summary">
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

      <SectionHeader title="What each person owes" style={styles.sectionHeader} />

      <View style={styles.personList}>
        {session.personTotals.map((person) => (
          <Card key={person.personId}>
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
              {person.itemLines?.map((line, index) => (
                <SummaryRow
                  key={`${person.personId}-${line.quantityLabel}-${index}`}
                  label={
                    line.sharedWithNames && line.sharedWithNames.length > 0
                      ? `${line.quantityLabel}\nShared with ${line.sharedWithNames.join(", ")}`
                      : line.quantityLabel
                  }
                  value={formatCurrency(line.amount)}
                />
              ))}
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
      </View>
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
    ...typography.display,
    color: colors.accent,
  },
  heroSubtitle: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  card: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  personList: {
    gap: spacing.md,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  personName: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    fontSize: typography.section.fontSize,
  },
  personAmount: {
    color: colors.accent,
    fontSize: typography.section.fontSize,
    fontWeight: fontWeight.bold,
  },
  personBreakdown: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
