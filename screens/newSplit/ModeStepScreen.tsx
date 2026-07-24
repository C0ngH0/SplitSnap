import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import { Banner, Button, SelectableOption } from "../../components";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { NewSplitStackParamList } from "../../navigation/types";
import type { SplitMode } from "../../types/split";
import { spacing } from "../../theme";
import { WizardStep } from "./WizardStep";

type Props = NativeStackScreenProps<NewSplitStackParamList, "ModeStep">;

const MODE_OPTIONS: {
  mode: SplitMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    mode: "even",
    label: "Even Split",
    description: "Split one final total equally among everyone.",
    icon: "reorder-four-outline",
  },
  {
    mode: "itemized",
    label: "Itemized Split",
    description: "Assign each item to one person.",
    icon: "person-outline",
  },
  {
    mode: "hybrid",
    label: "Hybrid Split",
    description: "Share items across multiple people.",
    icon: "people-outline",
  },
];

export default function ModeStepScreen({ navigation }: Props) {
  const draft = useSplitDraft();

  return (
    <WizardStep
      stepKey="mode"
      title="Choose split mode"
      subtitle="How do you want to split this bill?"
      footer={
        <Button
          title="Continue"
          size="lg"
          onPress={() => navigation.navigate("Participants")}
        />
      }
    >
      {draft.importMessage ? (
        <Banner tone="success" message={draft.importMessage} />
      ) : null}

      <View style={styles.options}>
        {MODE_OPTIONS.map((option) => (
          <SelectableOption
            key={option.mode}
            icon={option.icon}
            title={option.label}
            description={option.description}
            selected={draft.mode === option.mode}
            onPress={() => draft.setMode(option.mode)}
          />
        ))}
      </View>
    </WizardStep>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.md,
  },
});
