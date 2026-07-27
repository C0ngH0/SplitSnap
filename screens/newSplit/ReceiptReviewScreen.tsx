import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Banner, Button, Card, Input, Screen, SummaryRow } from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import type { ExtractedReceiptItem } from "../../types/receipt";
import { colors, fontSize, fontWeight, spacing } from "../../theme";
import { formatCurrency, parseAmount } from "../../utils/format";
import { deriveUnitPrice, round2, totalFromUnitPrice } from "../../utils/money";
import { formatTipSelectionLabel } from "../../utils/splitCalculator";

type Props = NativeStackScreenProps<NewSplitStackParamList, "ReceiptReview">;

type EditState = {
  name: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
};

function toEditState(item: ExtractedReceiptItem): EditState {
  return {
    name: item.name,
    quantity: String(item.quantity),
    unitPrice: item.unitPrice.toFixed(2),
    totalPrice: item.totalPrice.toFixed(2),
  };
}

export default function ReceiptReviewScreen({ navigation }: Props) {
  const draft = useSplitDraft();
  const receipt = draft.extractedReceipt;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

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

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditState(toEditState(receipt.items[index]));
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditState(null);
  };

  const saveEdit = () => {
    if (editingIndex === null || !editState) {
      return;
    }

    const quantity = Math.max(1, Math.floor(parseAmount(editState.quantity) || 1));
    const unitPrice = parseAmount(editState.unitPrice);
    const totalPrice = parseAmount(editState.totalPrice);
    const original = receipt.items[editingIndex];

    let next: ExtractedReceiptItem;

    // Prefer explicit total edits; if only unit changed, recompute total.
    const unitChanged = round2(unitPrice) !== round2(original.unitPrice);
    const totalChanged = round2(totalPrice) !== round2(original.totalPrice);

    if (unitChanged && !totalChanged) {
      next = {
        name: editState.name.trim() || original.name,
        quantity,
        unitPrice: round2(unitPrice),
        totalPrice: totalFromUnitPrice(unitPrice, quantity),
      };
    } else {
      const safeTotal = round2(totalPrice > 0 ? totalPrice : original.totalPrice);
      next = {
        name: editState.name.trim() || original.name,
        quantity,
        totalPrice: safeTotal,
        unitPrice: deriveUnitPrice(safeTotal, quantity),
      };
    }

    draft.updateExtractedItem(editingIndex, next);
    cancelEdit();
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
          {receipt.items.map((item, index) =>
            editingIndex === index && editState ? (
              <View key={`edit-${index}`} style={styles.editCard}>
                <Input
                  label="Name"
                  value={editState.name}
                  onChangeText={(name) =>
                    setEditState((current) =>
                      current ? { ...current, name } : current,
                    )
                  }
                />
                <Input
                  label="Quantity"
                  value={editState.quantity}
                  onChangeText={(quantity) =>
                    setEditState((current) =>
                      current ? { ...current, quantity } : current,
                    )
                  }
                  keyboardType="number-pad"
                />
                <Input
                  label="Unit price"
                  value={editState.unitPrice}
                  onChangeText={(unitPrice) =>
                    setEditState((current) =>
                      current ? { ...current, unitPrice } : current,
                    )
                  }
                  keyboardType="decimal-pad"
                />
                <Input
                  label="Total price"
                  value={editState.totalPrice}
                  onChangeText={(totalPrice) =>
                    setEditState((current) =>
                      current ? { ...current, totalPrice } : current,
                    )
                  }
                  keyboardType="decimal-pad"
                />
                <View style={styles.editActions}>
                  <Button
                    title="Save"
                    variant="accent"
                    onPress={saveEdit}
                    style={styles.editAction}
                  />
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={cancelEdit}
                    style={styles.editAction}
                  />
                </View>
              </View>
            ) : (
              <View
                key={`${item.name}-${item.totalPrice}-${index}`}
                style={styles.itemRow}
              >
                <View style={styles.itemText}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Qty {item.quantity} · Unit {formatCurrency(item.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.totalPrice)}
                </Text>
                <Button
                  title="Edit"
                  variant="ghost"
                  onPress={() => startEdit(index)}
                />
              </View>
            ),
          )}
        </View>

        <View style={styles.summary}>
          {validation ? (
            <SummaryRow
              label="Item subtotal"
              value={formatCurrency(validation.itemSubtotal)}
            />
          ) : null}
          <SummaryRow
            label="Tax"
            value={formatCurrency(receipt.tax)}
          />
          <SummaryRow
            label="Total"
            value={formatCurrency(receipt.total)}
            bold
          />
          <SummaryRow
            label={`Projected tip (${formatTipSelectionLabel(
              draft.tipMode,
              draft.tipPercent,
            )})`}
            value={formatCurrency(draft.extractedTipAmount)}
          />
        </View>
      </Card>

      {hasMeaningfulMismatch ? (
        <Banner
          tone="warning"
          message={
            validation?.warnings[0] ??
            "Item totals may not match the receipt. Edit quantities or prices above."
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  restaurant: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  itemCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  items: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemText: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  itemPrice: {
    color: colors.textBody,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  editCard: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSunken,
    borderRadius: 12,
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  editAction: {
    flex: 1,
  },
  summary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
});
