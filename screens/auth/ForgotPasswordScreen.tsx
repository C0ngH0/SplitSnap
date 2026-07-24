import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Banner, Button, Input, Screen } from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, lineHeight, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { requestPasswordReset, isSubmitting, error, clearMessages } = useAuth();
  const [email, setEmail] = useState("");

  useEffect(() => clearMessages(), [clearMessages]);

  const submit = async () => {
    if (await requestPasswordReset(email.trim())) {
      navigation.replace("ResetPassword", { email: email.trim() });
    }
  };

  return (
    <Screen>
      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.subheading}>
        Enter your email and we will send you a 6-digit reset code.
      </Text>

      {error ? <Banner tone="error" message={error} /> : null}

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onSubmitEditing={() => void submit()}
          returnKeyType="go"
        />
        <Button
          title="Send Reset Code"
          onPress={() => void submit()}
          loading={isSubmitting}
          disabled={email.trim().length === 0}
          size="lg"
        />
        <Button
          title="I already have a code"
          variant="ghost"
          onPress={() =>
            navigation.replace("ResetPassword", { email: email.trim() })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  subheading: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
