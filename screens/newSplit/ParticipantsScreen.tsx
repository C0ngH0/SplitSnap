import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Avatar, Banner, Button, EmptyState, Input } from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import type { Person } from "../../types/split";
import { colors, fontSize, fontWeight, radius, spacing } from "../../theme";
import { WizardStep } from "./WizardStep";

type Props = NativeStackScreenProps<NewSplitStackParamList, "Participants">;

export default function ParticipantsScreen({ navigation }: Props) {
  const draft = useSplitDraft();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const addPerson = () => {
    if (name.trim().length === 0) {
      return;
    }

    draft.addPerson(name);
    setName("");
  };

  const startEditing = (person: Person) => {
    setEditingId(person.id);
    setEditingName(person.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = () => {
    if (!editingId) {
      return;
    }

    draft.updatePerson(editingId, editingName);
    cancelEditing();
  };

  const removePerson = (personId: string) => {
    if (editingId === personId) {
      cancelEditing();
    }

    draft.removePerson(personId);
  };

  const hasEnoughPeople = draft.people.length >= 2;

  return (
    <WizardStep
      stepKey="people"
      title="Who is splitting?"
      subtitle="Add everyone sharing this bill."
      footer={
        <>
          {!hasEnoughPeople ? (
            <Text style={styles.footerHint}>
              Add at least 2 people to continue.
            </Text>
          ) : null}
          <Button
            title="Continue"
            size="lg"
            disabled={!hasEnoughPeople}
            onPress={() =>
              navigation.navigate(
                draft.mode === "even" ? "BillTotal" : "Items",
              )
            }
          />
        </>
      }
    >
      {draft.error ? <Banner tone="error" message={draft.error} /> : null}

      <View style={styles.addRow}>
        <Input
          placeholder="Person name"
          value={name}
          onChangeText={setName}
          onSubmitEditing={addPerson}
          returnKeyType="done"
          containerStyle={styles.addInput}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addPerson}
          accessibilityRole="button"
          accessibilityLabel="Add participant"
        >
          <Ionicons name="add" size={24} color={colors.accentText} />
        </TouchableOpacity>
      </View>

      {draft.people.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No one added yet"
          description="Add the people sharing this bill to get started."
        />
      ) : (
        <View style={styles.list}>
          {draft.people.map((person) =>
            editingId === person.id ? (
              <View key={person.id} style={styles.editCard}>
                <Input
                  value={editingName}
                  onChangeText={setEditingName}
                  placeholder="Participant name"
                  autoFocus
                  onSubmitEditing={saveEdit}
                  returnKeyType="done"
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
              <View key={person.id} style={styles.personRow}>
                <Avatar name={person.name} />
                <Text style={styles.personName} numberOfLines={1}>
                  {person.name}
                </Text>
                <TouchableOpacity
                  onPress={() => startEditing(person)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${person.name}`}
                  hitSlop={8}
                >
                  <Ionicons
                    name="pencil"
                    size={18}
                    color={colors.primaryLink}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removePerson(person.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${person.name}`}
                  hitSlop={8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.danger}
                  />
                </TouchableOpacity>
              </View>
            ),
          )}
        </View>
      )}
    </WizardStep>
  );
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    width: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  personName: {
    flex: 1,
    color: colors.textBody,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
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
  footerHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
