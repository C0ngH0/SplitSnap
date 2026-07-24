import type { ComponentProps, ReactNode, RefObject } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "../theme";

type ScreenProps = {
  children: ReactNode;
  /** Pinned to the bottom, outside the scroll area. */
  footer?: ReactNode;
  scroll?: boolean;
  /** Set when the screen renders its own header, so we pad the status bar. */
  edgeTop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scrollRef?: RefObject<ScrollView | null>;
  refreshControl?: ComponentProps<typeof ScrollView>["refreshControl"];
};

export function Screen({
  children,
  footer,
  scroll = true,
  edgeTop = false,
  contentStyle,
  scrollRef,
  refreshControl,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        edgeTop && { paddingTop: insets.top + spacing.md },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        styles.content,
        edgeTop && { paddingTop: insets.top + spacing.md },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {body}
        {footer ? (
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});
