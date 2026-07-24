import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import {
  Banner,
  Button,
  Card,
  Chip,
  Input,
  SummaryRow,
} from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import { TIP_PERCENT_PRESETS } from "../../types/split";
import { colors, fontSize, spacing } from "../../theme";
import { formatCurrency, parseAmount } from "../../utils/format";
import { WizardStep } from "./WizardStep";

type Props = NativeStackScreenProps<NewSplitStackParamList, "TaxTip">;

export default function TaxTipScreen({ navigation }: Props) {
  const draft = useSplitDraft();

  const tax = parseAmount(draft.tax);
  const projectedTotal = draft.itemsSubtotal + tax + draft.currentTipAmount;

  const calculate = () => {
    if (draft.calculate()) {
      navigation.navigate("Results");
    }
  };

  return (
    <WizardStep
      stepKey="taxtip"
      title="Tax and tip"
      subtitle="Tip is calculated from the items subtotal."
      footer={<Button title="Calculate" size="lg" onPress={calculate} />}
    >
      {draft.error ? <Banner tone="error" message={draft.error} /> : null}

      <Input
        label="Tax ($)"
        placeholder="e.g. 7.12"
        value={draft.tax}
        onChangeText={draft.setTax}
        keyboardType="decimal-pad"
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
          Calculated tip: {formatCurrency(draft.currentTipAmount)}
          {draft.itemsSubtotal > 0
            ? ` (${draft.tipPercent}% of ${formatCurrency(draft.itemsSubtotal)})`
            : " — add items to calculate"}
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

      <Card style={styles.summary}>
        <SummaryRow
          label="Items subtotal"
          value={formatCurrency(draft.itemsSubtotal)}
        />
        <SummaryRow label="Tax" value={formatCurrency(tax)} />
        <SummaryRow
          label="Tip"
          value={formatCurrency(draft.currentTipAmount)}
        />
        <SummaryRow
          label="Estimated total"
          value={formatCurrency(projectedTotal)}
          bold
          highlight
        />
      </Card>
    </WizardStep>
  );
}

const styles = StyleSheet.create({
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
  summary: {
    marginTop: spacing.xl,
  },
});
