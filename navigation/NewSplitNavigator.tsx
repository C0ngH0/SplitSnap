import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity } from "react-native";

import { useSplitDraft } from "../contexts/SplitDraftContext";
import BillTotalScreen from "../screens/newSplit/BillTotalScreen";
import ItemsScreen from "../screens/newSplit/ItemsScreen";
import ModeStepScreen from "../screens/newSplit/ModeStepScreen";
import ParticipantsScreen from "../screens/newSplit/ParticipantsScreen";
import ReceiptReviewScreen from "../screens/newSplit/ReceiptReviewScreen";
import ReceiptSourceScreen from "../screens/newSplit/ReceiptSourceScreen";
import ResultsScreen from "../screens/newSplit/ResultsScreen";
import TaxTipScreen from "../screens/newSplit/TaxTipScreen";
import { colors } from "../theme";
import { stackScreenOptions } from "./screenOptions";
import type { NewSplitStackParamList } from "./types";

const Stack = createNativeStackNavigator<NewSplitStackParamList>();

function CancelButton() {
  const navigation = useNavigation();
  const { reset } = useSplitDraft();

  return (
    <TouchableOpacity
      onPress={() => {
        reset();
        navigation.getParent()?.goBack();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Cancel this split"
    >
      <Ionicons name="close" size={24} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function NewSplitNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackScreenOptions,
        headerRight: () => <CancelButton />,
      }}
    >
      <Stack.Screen
        name="ReceiptSource"
        component={ReceiptSourceScreen}
        options={{ title: "New Split" }}
      />
      <Stack.Screen
        name="ReceiptReview"
        component={ReceiptReviewScreen}
        options={{ title: "Review Receipt" }}
      />
      <Stack.Screen
        name="ModeStep"
        component={ModeStepScreen}
        options={{ title: "Split Mode" }}
      />
      <Stack.Screen
        name="Participants"
        component={ParticipantsScreen}
        options={{ title: "People" }}
      />
      <Stack.Screen
        name="Items"
        component={ItemsScreen}
        options={{ title: "Items" }}
      />
      <Stack.Screen
        name="BillTotal"
        component={BillTotalScreen}
        options={{ title: "Bill Total" }}
      />
      <Stack.Screen
        name="TaxTip"
        component={TaxTipScreen}
        options={{ title: "Tax & Tip" }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ title: "Results", headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
