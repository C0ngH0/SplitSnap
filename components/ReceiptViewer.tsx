import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import ImageViewing from "react-native-image-viewing";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "../theme";

type Props = {
  visible: boolean;
  imageUrl: string | null | undefined;
  onClose: () => void;
};

/**
 * Full-screen receipt viewer with pinch/pan zoom via react-native-image-viewing.
 */
export function ReceiptViewer({ visible, imageUrl, onClose }: Props) {
  const insets = useSafeAreaInsets();

  if (!imageUrl) {
    return null;
  }

  return (
    <ImageViewing
      images={[{ uri: imageUrl }]}
      imageIndex={0}
      visible={visible}
      onRequestClose={onClose}
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      presentationStyle="overFullScreen"
      animationType="fade"
      backgroundColor="#000000"
      HeaderComponent={() => (
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close receipt image"
            hitSlop={12}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 2,
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 24, 39, 0.72)",
  },
});
