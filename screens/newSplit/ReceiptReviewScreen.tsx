import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { Banner, Button, Card, Screen, SummaryRow } from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, spacing } from "../../theme";
import { formatCurrency } from "../../utils/format";
import { formatTipSelectionLabel } from "../../utils/splitCalculator";

type Props = NativeStackScreenProps<NewSplitStackParamList, "ReceiptReview">;

export default function ReceiptReviewScreen({ navigation }: Props) {
  const draft = useSplitDraft();
  const receipt = draft.extractedReceipt;

  if (!receipt) {
    return (
      <Screen>
        <Banner
          tone="info"
          message="No extracted receipt yet. Go back and scan one."
        />
      </Screen>
    );
  }

  const validation = receipt.validation;
  const hasMeaningfulMismatch =
    validation?.hasMismatch && Math.abs(validation.difference) > 0.01;

  const useReceipt = () => {
    if (draft.importExtractedReceipt()) {
      navigation.navigate("ModeStep");
    }
  };

  return (
    <Screen
      footer={
        <Button
          title="Use These Items"
          icon="checkmark"
          variant="accent"
          size="lg"
          onPress={useReceipt}
        />
      }
    >
      {draft.error ? <Banner tone="error" message={draft.error} /> : null}

      <Card>
        <Text style={styles.restaurant}>
          {receipt.restaurantName || "Receipt"}
        </Text>
        <Text style={styles.itemCount}>
          {receipt.items.length}{" "}
          {receipt.items.length === 1 ? "item" : "items"} found
        </Text>

        <View style={styles.items}>
          {receipt.items.map((item, index) => (
            <View
              key={`${item.name}-${item.price}-${index}`}
              style={styles.itemRow}
            >
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.price)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          {validation ? (
            <SummaryRow
              label="Item subtotal"
              value={formatCurrency(validation.itemSubtotal)}
            />
          ) : null}
          <SummaryRow
            label="Subtotal"
            value={formatCurrency(receipt.subtotal)}
          />
          <SummaryRow label="Tax" value={formatCurrency(receipt.tax)} />
          <SummaryRow
            label="Total"
            value={formatCurrency(receipt.total)}
            bold
          />
          <SummaryRow
            label={`Tip (${formatTipSelectionLabel(draft.tipMode, draft.tipPercent)})`}
            value={formatCurrency(draft.extractedTipAmount)}
            bold
          />
        </View>
      </Card>

      {hasMeaningfulMismatch ? (
        <Banner tone="warning" title="Review extracted items">
          {validation.warnings.map((warning, index) => (
            <Text key={`${warning}-${index}`} style={styles.warning}>
              {warning}
            </Text>
          ))}
          <Text style={styles.warning}>
            Difference: {formatCurrency(validation.difference)}
          </Text>
        </Banner>
      ) : null}

      <Text style={styles.hint}>
        You can edit any item, price, or the tax amount in the next steps.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  restaurant: {
    color: colors.primaryInfo,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  itemCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs / 2,
  },
  items: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  itemName: {
    color: colors.textBody,
    fontSize: fontSize.md,
    flex: 1,
    marginRight: spacing.md,
  },
  itemPrice: {
    color: colors.textBody,
    fontSize: fontSize.md,
  },
  summary: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  warning: {
    color: colors.warningText,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  hint: {
    color: colors.textPlaceholder,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
