import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, fontSize, radius, spacing } from "../theme";

type InputProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, containerStyle, style, ...textInputProps },
  ref,
) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor={colors.textPlaceholder}
        {...textInputProps}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
  },
});
