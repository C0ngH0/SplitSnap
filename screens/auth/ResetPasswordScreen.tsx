import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Banner, Button, Input, Screen } from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, lineHeight, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { submitPasswordReset, isSubmitting, error, status, clearMessages } =
    useAuth();
  const [email, setEmail] = useState(route.params?.email ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => clearMessages(), [clearMessages]);

  const submit = async () => {
    const succeeded = await submitPasswordReset(
      email.trim(),
      code,
      newPassword,
      confirmPassword,
    );

    if (succeeded) {
      navigation.navigate("Login");
    }
  };

  return (
    <Screen>
      <Text style={styles.heading}>Enter your reset code</Text>
      <Text style={styles.subheading}>
        Check your email for the 6-digit code, then choose a new password.
      </Text>

      {error ? <Banner tone="error" message={error} /> : null}
      {status && !error ? <Banner tone="info" message={status} /> : null}

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Input
          label="Reset code"
          placeholder="123456"
          value={code}
          // The backend only accepts exactly six digits, so strip anything else
          // as it is typed rather than failing the request later.
          onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.code}
        />
        <Input
          label="New password"
          placeholder="Choose a new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <Input
          label="Confirm new password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={() => void submit()}
          returnKeyType="go"
        />
        <Button
          title="Reset Password"
          onPress={() => void submit()}
          loading={isSubmitting}
          disabled={
            email.trim().length === 0 ||
            code.length === 0 ||
            newPassword.length === 0
          }
          size="lg"
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
  code: {
    letterSpacing: 8,
    fontSize: fontSize.title,
    textAlign: "center",
  },
});
