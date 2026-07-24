import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { Avatar, Banner, Button, Card, Input } from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, spacing } from "../../theme";
import { formatCurrency, parseAmount } from "../../utils/format";
import { WizardStep } from "./WizardStep";

type Props = NativeStackScreenProps<NewSplitStackParamList, "BillTotal">;

export default function BillTotalScreen({ navigation }: Props) {
  const draft = useSplitDraft();

  const total = parseAmount(draft.billTotal);
  const perPerson =
    draft.people.length > 0 ? total / draft.people.length : 0;

  const calculate = () => {
    if (draft.calculate()) {
      navigation.navigate("Results");
    }
  };

  return (
    <WizardStep
      stepKey="total"
      title="Final bill total"
      subtitle="Enter the amount on the bill, including tax and tip."
      footer={
        <Button title="Calculate" size="lg" onPress={calculate} />
      }
    >
      {draft.error ? <Banner tone="error" message={draft.error} /> : null}

      <Input
        label="Total ($)"
        placeholder="e.g. 86.40"
        value={draft.billTotal}
        onChangeText={draft.setBillTotal}
        keyboardType="decimal-pad"
        style={styles.amountInput}
      />

      {total > 0 && draft.people.length > 0 ? (
        <Card style={styles.preview}>
          <Text style={styles.previewLabel}>Each person pays</Text>
          <Text style={styles.previewAmount}>
            {formatCurrency(perPerson)}
          </Text>
          <Text style={styles.previewHint}>
            {formatCurrency(total)} split between {draft.people.length} people
          </Text>

          <View style={styles.people}>
            {draft.people.map((person) => (
              <View key={person.id} style={styles.person}>
                <Avatar name={person.name} size={28} />
                <Text style={styles.personName} numberOfLines={1}>
                  {person.name}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </WizardStep>
  );
}

const styles = StyleSheet.create({
  amountInput: {
    fontSize: fontSize.display - 4,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  preview: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  previewLabel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  previewAmount: {
    color: colors.accent,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
    marginTop: spacing.xs,
  },
  previewHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  people: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  personName: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    maxWidth: 90,
  },
});
