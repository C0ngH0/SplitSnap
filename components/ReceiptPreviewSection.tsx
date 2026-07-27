import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, fontSize, fontWeight, radius, spacing } from "../theme";
import { ReceiptViewer } from "./ReceiptViewer";

type Props = {
  imageUrl: string | null | undefined;
  style?: StyleProp<ViewStyle>;
};

/**
 * Compact receipt thumbnail. Hidden entirely when no image is available.
 * Full-resolution viewer opens only on tap.
 */
export function ReceiptPreviewSection({ imageUrl, style }: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);

  if (!imageUrl) {
    return null;
  }

  return (
    <View style={[styles.section, style]}>
      <Text style={styles.title}>Receipt</Text>
      <Pressable
        onPress={() => setViewerOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="Receipt image"
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </Pressable>

      <ReceiptViewer
        visible={viewerOpen}
        imageUrl={imageUrl}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  thumbnail: {
    width: "100%",
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
