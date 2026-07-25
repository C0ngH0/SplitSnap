import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { Avatar, Banner, Button, Card, Chip, Input } from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import { TIP_PERCENT_PRESETS } from "../../types/split";
import { colors, fontSize, fontWeight, spacing } from "../../theme";
import { formatCurrency, parseAmount } from "../../utils/format";
import { WizardStep } from "./WizardStep";

type Props = NativeStackScreenProps<NewSplitStackParamList, "BillTotal">;

export default function BillTotalScreen({ navigation }: Props) {
  const draft = useSplitDraft();

  const billTotal = parseAmount(draft.billTotal);
  const tipAmount = draft.currentTipAmount;
  const finalTotal = billTotal + tipAmount;
  const perPerson =
    draft.people.length > 0 ? finalTotal / draft.people.length : 0;

  const calculate = () => {
    if (draft.calculate()) {
      navigation.navigate("Results");
    }
  };

  return (
    <WizardStep
      stepKey="total"
      title="Bill total and tip"
      subtitle="Enter the bill amount before tip, then choose gratuity."
      footer={
        <Button title="Calculate" size="lg" onPress={calculate} />
      }
    >
      {draft.error ? <Banner tone="error" message={draft.error} /> : null}

      <Input
        label="Bill total ($)"
        placeholder="e.g. 86.40"
        value={draft.billTotal}
        onChangeText={draft.setBillTotal}
        keyboardType="decimal-pad"
        style={styles.amountInput}
      />

      <Text style={styles.label}>Tip</Text>
      <View style={styles.chips}>
        {TIP_PERCENT_PRESETS.map((percent) => (
          <Chip
            key={percent}
            label={`${percent}%`}
            selected={
              draft.tipMode === "percentage" && draft.tipPercent === percent
            }
            onPress={() => draft.selectTipPreset(percent)}
          />
        ))}
        <Chip
          label="Custom"
          selected={draft.tipMode === "fixed"}
          onPress={draft.selectCustomTipMode}
        />
      </View>

      {draft.tipMode === "percentage" ? (
        <Text style={styles.tipHint}>
          Calculated tip: {formatCurrency(tipAmount)}
          {billTotal > 0
            ? ` (${draft.tipPercent}% of ${formatCurrency(billTotal)})`
            : " — enter a bill total to calculate"}
        </Text>
      ) : (
        <View style={styles.customTip}>
          <Input
            placeholder="Custom tip amount"
            value={draft.customTip}
            onChangeText={draft.setCustomTip}
            keyboardType="decimal-pad"
          />
          <Text style={styles.tipHint}>
            Tip amount: {formatCurrency(parseAmount(draft.customTip))}
          </Text>
        </View>
      )}

      {billTotal > 0 && draft.people.length > 0 ? (
        <Card style={styles.preview}>
          <Text style={styles.previewLabel}>Each person pays</Text>
          <Text style={styles.previewAmount}>
            {formatCurrency(perPerson)}
          </Text>
          <Text style={styles.previewHint}>
            {formatCurrency(finalTotal)} ({formatCurrency(billTotal)} +{" "}
            {formatCurrency(tipAmount)} tip) split between{" "}
            {draft.people.length} people
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
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tipHint: {
    color: colors.primaryInfo,
    fontSize: fontSize.md,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  customTip: {
    marginTop: spacing.md,
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
    textAlign: "center",
    paddingHorizontal: spacing.md,
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
