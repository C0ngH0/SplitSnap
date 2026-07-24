import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Banner, Button, Input, Screen } from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, lineHeight, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login, isSubmitting, error, clearMessages } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => clearMessages(), [clearMessages]);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  // A successful login flips the root navigator over to the main tabs, so
  // there is nothing to navigate to here.
  const submit = () => {
    void login(email.trim(), password);
  };

  return (
    <Screen>
      <Text style={styles.heading}>Welcome back</Text>
      <Text style={styles.subheading}>
        Log in to save your splits and load them on any device.
      </Text>

      {error ? (
        <Banner tone="error" message={error} />
      ) : null}

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
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          onSubmitEditing={canSubmit ? submit : undefined}
          returnKeyType="go"
        />
        <Button
          title="Log In"
          onPress={submit}
          loading={isSubmitting}
          disabled={!canSubmit}
          size="lg"
        />
      </View>

      <View style={styles.links}>
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("ResetPassword")}>
          <Text style={styles.link}>I have a reset code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to Tably?</Text>
        <TouchableOpacity onPress={() => navigation.replace("Register")}>
          <Text style={styles.link}>Create an account</Text>
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
  links: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  link: {
    color: colors.primaryLink,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
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
});
