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
  QuantityStepper,
} from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import type { ReceiptItem } from "../../types/split";
import { colors, fontSize, fontWeight, radius, spacing } from "../../theme";
import { formatCurrency } from "../../utils/format";
import {
  assignedUnitCount,
  getIndividualQuantity,
  isParticipantAssigned,
  remainingUnitCount,
} from "../../utils/itemAllocations";
import { WizardStep } from "./WizardStep";

type Props = NativeStackScreenProps<NewSplitStackParamList, "Items">;

export default function ItemsScreen({ navigation }: Props) {
  const draft = useSplitDraft();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPrice, setEditingPrice] = useState("");
  const [editingQuantity, setEditingQuantity] = useState("1");

  const { clearImportMessage } = draft;
  useEffect(() => clearImportMessage, [clearImportMessage]);

  const addItem = () => {
    draft.addItem(name, price, quantity);
    setName("");
    setPrice("");
    setQuantity("1");
  };

  const startEditing = (item: ReceiptItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingPrice(item.totalPrice.toFixed(2));
    setEditingQuantity(String(item.quantity));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setEditingPrice("");
    setEditingQuantity("1");
  };

  const saveEdit = () => {
    if (!editingId) {
      return;
    }

    draft.updateItem(editingId, editingName, editingPrice, {
      quantity: editingQuantity,
    });
    cancelEditing();
  };

  const removeItem = (itemId: string) => {
    if (editingId === itemId) {
      cancelEditing();
    }

    draft.removeItem(itemId);
  };

  const isEvenMode = draft.mode === "even";
  const isItemized = draft.mode === "itemized";
  const isHybrid = draft.mode === "hybrid";
  const incompleteCount = draft.items.filter(
    (item) => remainingUnitCount(item) > 0,
  ).length;

  return (
    <WizardStep
      stepKey="items"
      title="Receipt items"
      subtitle={
        isEvenMode
          ? "Add or edit each line from the receipt. The total is split evenly later."
          : isItemized
            ? "Assign every unit to exactly one person."
            : "Assign individual units, then share any remainder."
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
          {!isEvenMode ? (
            incompleteCount > 0 ? (
              <Text style={styles.unassigned}>
                {incompleteCount} incomplete
              </Text>
            ) : (
              <Text style={styles.allAssigned}>All assigned</Text>
            )
          ) : null}
        </View>
      ) : null}

      {draft.items.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No items yet"
          description={
            isEvenMode
              ? "Add each line from the receipt. Everyone will split the final total evenly."
              : "Add each line from the receipt, then assign units to participants."
          }
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
                  value={editingQuantity}
                  onChangeText={setEditingQuantity}
                  placeholder="Quantity"
                  keyboardType="number-pad"
                />
                <Input
                  value={editingPrice}
                  onChangeText={setEditingPrice}
                  placeholder="Total price"
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
                <View
                  style={[
                    styles.itemHeader,
                    isEvenMode ? styles.itemHeaderEven : null,
                  ]}
                >
                  <View style={styles.itemTitleBlock}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity} × {formatCurrency(item.unitPrice)} ·{" "}
                      {formatCurrency(item.totalPrice)}
                    </Text>
                    {!isEvenMode ? (
                      <Text style={styles.itemProgress}>
                        {assignedUnitCount(item)} of {item.quantity} assigned
                      </Text>
                    ) : null}
                  </View>
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

                {!isEvenMode && draft.people.length === 0 ? (
                  <Text style={styles.noPeople}>
                    Go back and add participants first.
                  </Text>
                ) : null}

                {!isEvenMode && draft.people.length > 0 && item.quantity === 1 ? (
                  <>
                    <Text style={styles.assignmentLabel}>
                      {isItemized ? "Assigned to" : "Shared with"}
                    </Text>
                    <View style={styles.chips}>
                      {draft.people.map((person) => (
                        <Chip
                          key={person.id}
                          label={person.name}
                          selected={isParticipantAssigned(item, person.id)}
                          onPress={() =>
                            draft.toggleAssignment(item.id, person.id)
                          }
                        />
                      ))}
                    </View>
                  </>
                ) : null}

                {!isEvenMode && draft.people.length > 0 && item.quantity > 1 ? (
                  <View style={styles.quantityAssign}>
                    <Text style={styles.assignmentLabel}>
                      Individual units
                    </Text>
                    {draft.people.map((person) => (
                      <QuantityStepper
                        key={`${item.id}-${person.id}`}
                        label={person.name}
                        value={getIndividualQuantity(item, person.id)}
                        min={0}
                        max={
                          item.quantity -
                          (item.sharedAllocation?.quantity ?? 0) -
                          item.individualAllocations
                            .filter(
                              (allocation) =>
                                allocation.participantId !== person.id,
                            )
                            .reduce(
                              (sum, allocation) => sum + allocation.quantity,
                              0,
                            )
                        }
                        onChange={(value) =>
                          draft.setIndividualQuantity(
                            item.id,
                            person.id,
                            value,
                          )
                        }
                      />
                    ))}

                    {isHybrid ? (
                      <>
                        <Text style={[styles.assignmentLabel, styles.sharedLabel]}>
                          Shared remainder
                        </Text>
                        <QuantityStepper
                          label="Shared units"
                          value={item.sharedAllocation?.quantity ?? 0}
                          min={0}
                          max={
                            item.quantity -
                            item.individualAllocations.reduce(
                              (sum, allocation) => sum + allocation.quantity,
                              0,
                            )
                          }
                          onChange={(value) =>
                            draft.setSharedQuantity(item.id, value)
                          }
                        />
                        {(item.sharedAllocation?.quantity ?? 0) > 0 ? (
                          <View style={styles.chips}>
                            {draft.people.map((person) => (
                              <Chip
                                key={`shared-${item.id}-${person.id}`}
                                label={person.name}
                                selected={Boolean(
                                  item.sharedAllocation?.participantIds.includes(
                                    person.id,
                                  ),
                                )}
                                onPress={() =>
                                  draft.toggleSharedParticipant(
                                    item.id,
                                    person.id,
                                  )
                                }
                              />
                            ))}
                          </View>
                        ) : null}
                      </>
                    ) : null}
                  </View>
                ) : null}
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
            label="Quantity"
            placeholder="1"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />
          <Input
            label="Total price"
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
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemHeaderEven: {
    marginBottom: 0,
  },
  itemTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  itemMeta: {
    color: colors.textBody,
    fontSize: fontSize.sm,
  },
  itemProgress: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  assignmentLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  sharedLabel: {
    marginTop: spacing.md,
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
  quantityAssign: {
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
