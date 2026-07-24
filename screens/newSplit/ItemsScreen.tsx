import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  Banner,
  Button,
  Chip,
  EmptyState,
  Input,
} from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import type { ReceiptItem } from "../../types/split";
import { colors, fontSize, fontWeight, radius, spacing } from "../../theme";
import { formatCurrency } from "../../utils/format";
import { WizardStep } from "./WizardStep";

type Props = NativeStackScreenProps<NewSplitStackParamList, "Items">;

export default function ItemsScreen({ navigation }: Props) {
  const draft = useSplitDraft();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPrice, setEditingPrice] = useState("");

  // The import banner has done its job once the user leaves this step.
  const { clearImportMessage } = draft;
  useEffect(() => clearImportMessage, [clearImportMessage]);

  const addItem = () => {
    draft.addItem(name, price);
    setName("");
    setPrice("");
  };

  const startEditing = (item: ReceiptItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingPrice(item.price.toFixed(2));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setEditingPrice("");
  };

  const saveEdit = () => {
    if (!editingId) {
      return;
    }

    draft.updateItem(editingId, editingName, editingPrice);
    cancelEditing();
  };

  const removeItem = (itemId: string) => {
    if (editingId === itemId) {
      cancelEditing();
    }

    draft.removeItem(itemId);
  };

  const unassignedCount = draft.items.filter(
    (item) => item.assignedTo.length === 0,
  ).length;

  const assignmentLabel =
    draft.mode === "itemized" ? "Assigned to" : "Shared with";

  return (
    <WizardStep
      stepKey="items"
      title="Receipt items"
      subtitle={
        draft.mode === "itemized"
          ? "Assign every item to exactly one person."
          : "Tap everyone who shared each item."
      }
      footer={
        <Button
          title="Continue"
          size="lg"
          disabled={draft.items.length === 0}
          onPress={() => navigation.navigate("TaxTip")}
        />
      }
    >
      {draft.error ? <Banner tone="error" message={draft.error} /> : null}
      {draft.importMessage ? (
        <Banner tone="success" message={draft.importMessage} />
      ) : null}

      {draft.items.length > 0 ? (
        <View style={styles.totals}>
          <Text style={styles.totalsText}>
            {draft.items.length}{" "}
            {draft.items.length === 1 ? "item" : "items"} ·{" "}
            {formatCurrency(draft.itemsSubtotal)}
          </Text>
          {unassignedCount > 0 ? (
            <Text style={styles.unassigned}>
              {unassignedCount} unassigned
            </Text>
          ) : (
            <Text style={styles.allAssigned}>All assigned</Text>
          )}
        </View>
      ) : null}

      {draft.items.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No items yet"
          description="Add each line from the receipt, then assign it to whoever ordered it."
        />
      ) : (
        <View style={styles.list}>
          {draft.items.map((item) =>
            editingId === item.id ? (
              <View key={item.id} style={styles.editCard}>
                <Input
                  value={editingName}
                  onChangeText={setEditingName}
                  placeholder="Item name"
                  autoFocus
                />
                <Input
                  value={editingPrice}
                  onChangeText={setEditingPrice}
                  placeholder="Item price"
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
                    onPress={cancelEditing}
                    style={styles.editAction}
                  />
                </View>
              </View>
            ) : (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(item.price)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => startEditing(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="pencil"
                      size={16}
                      color={colors.primaryLink}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.assignmentLabel}>{assignmentLabel}</Text>
                {draft.people.length === 0 ? (
                  <Text style={styles.noPeople}>
                    Go back and add participants first.
                  </Text>
                ) : (
                  <View style={styles.chips}>
                    {draft.people.map((person) => (
                      <Chip
                        key={person.id}
                        label={person.name}
                        selected={item.assignedTo.includes(person.id)}
                        onPress={() =>
                          draft.toggleAssignment(item.id, person.id)
                        }
                      />
                    ))}
                  </View>
                )}
              </View>
            ),
          )}
        </View>
      )}

      {showAddForm ? (
        <View style={styles.addCard}>
          <Input
            label="Item name"
            placeholder="e.g. Margherita Pizza"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Input
            label="Item price"
            placeholder="e.g. 18.50"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <View style={styles.editActions}>
            <Button
              title="Add Item"
              variant="accent"
              onPress={addItem}
              style={styles.editAction}
            />
            <Button
              title="Done"
              variant="outline"
              onPress={() => setShowAddForm(false)}
              style={styles.editAction}
            />
          </View>
        </View>
      ) : (
        <Button
          title="Add Item"
          icon="add"
          variant="outline"
          onPress={() => setShowAddForm(true)}
          style={styles.addButton}
        />
      )}
    </WizardStep>
  );
}

const styles = StyleSheet.create({
  totals: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  totalsText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  unassigned: {
    color: colors.warningBorder,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  allAssigned: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  list: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  itemPrice: {
    color: colors.textBody,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  assignmentLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  noPeople: {
    color: colors.textPlaceholder,
    fontSize: fontSize.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  editCard: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.md,
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  editAction: {
    flex: 1,
  },
  addCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  addButton: {
    marginTop: spacing.lg,
  },
});
