import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Banner, Button, Input, Screen } from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, lineHeight, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register, isSubmitting, error, setError, clearMessages } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => clearMessages(), [clearMessages]);

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0;

  const submit = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    void register(email.trim(), password);
  };

  return (
    <Screen>
      <Text style={styles.heading}>Create your account</Text>
      <Text style={styles.subheading}>
        Save your splits, revisit them later, and keep them in sync.
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
        />
        <Input
          label="Password"
          placeholder="Choose a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={canSubmit ? submit : undefined}
          returnKeyType="go"
        />
        <Button
          title="Create Account"
          onPress={submit}
          loading={isSubmitting}
          disabled={!canSubmit}
          size="lg"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Text style={styles.link}>Log in</Text>
        </TouchableOpacity>
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs + 2,
    marginTop: spacing.xxxl,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  link: {
    color: colors.primaryLink,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
