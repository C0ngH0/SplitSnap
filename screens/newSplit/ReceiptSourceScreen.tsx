import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Banner, Button, SelectableOption } from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, radius, spacing } from "../../theme";
import { WizardStep } from "./WizardStep";

type Props = NativeStackScreenProps<NewSplitStackParamList, "ReceiptSource">;

export default function ReceiptSourceScreen({ navigation }: Props) {
  const draft = useSplitDraft();

  const runExtraction = async () => {
    await draft.extractReceipt();
  };

  return (
    <WizardStep
      stepKey="receipt"
      title="Add your receipt"
      subtitle="We will pull out the line items and totals for you."
      footer={
        <Button
          title={draft.receiptImageUri ? "Skip extraction" : "Enter manually"}
          variant="ghost"
          onPress={() => navigation.navigate("ModeStep")}
        />
      }
    >
      {draft.error ? <Banner tone="error" message={draft.error} /> : null}

      {draft.receiptImageUri ? (
        <View style={styles.stack}>
          <Image
            source={{ uri: draft.receiptImageUri }}
            style={styles.preview}
            resizeMode="cover"
            accessibilityLabel="Receipt preview"
          />

          <View style={styles.row}>
            <Button
              title="Retake"
              icon="camera-outline"
              variant="outline"
              onPress={() => void draft.takeReceiptPhoto()}
              style={styles.rowItem}
            />
            <Button
              title="Change"
              icon="images-outline"
              variant="outline"
              onPress={() => void draft.pickReceiptFromLibrary()}
              style={styles.rowItem}
            />
          </View>

          {draft.isExtracting ? (
            <View style={styles.extracting}>
              <ActivityIndicator color={colors.primaryInfo} size="small" />
              <Text style={styles.extractingText}>Extracting receipt...</Text>
            </View>
          ) : (
            <Button
              title="Extract Receipt"
              icon="sparkles-outline"
              onPress={() => void runExtraction()}
              size="lg"
            />
          )}

          {draft.extractedReceipt && !draft.isExtracting ? (
            <Button
              title="Review extracted items"
              variant="accent"
              onPress={() => navigation.navigate("ReceiptReview")}
            />
          ) : null}

          <TouchableOpacity
            onPress={draft.removeReceiptImage}
            style={styles.removeButton}
          >
            <Text style={styles.removeText}>Remove photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.stack}>
          <SelectableOption
            icon="camera-outline"
            title="Scan Receipt"
            description="Use your camera to take a photo"
            chevron
            onPress={() => void draft.takeReceiptPhoto()}
          />
          <SelectableOption
            icon="images-outline"
            title="Choose from Library"
            description="Import from your photo library"
            chevron
            onPress={() => void draft.pickReceiptFromLibrary()}
          />
        </View>
      )}
    </WizardStep>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  preview: {
    width: "100%",
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  extracting: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  extractingText: {
    color: colors.primaryInfo,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  removeButton: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
  removeText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
