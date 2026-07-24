import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { Banner, Button, Screen } from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, lineHeight, radius, spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  const { continueAsGuest, error, status } = useAuth();

  return (
    <Screen edgeTop contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Ionicons name="receipt-outline" size={30} color={colors.primaryText} />
        </View>
        <Text style={styles.logo}>Welcome to Tably</Text>
        <Text style={styles.tagline}>
          Scan a receipt, split it fairly, and see exactly what everyone owes.
        </Text>
      </View>

      {error ? <Banner tone="error" message={error} /> : null}
      {status ? <Banner tone="success" message={status} /> : null}

      <View style={styles.actions}>
        <Button
          title="Continue as Guest"
          icon="arrow-forward"
          onPress={() => {
            void continueAsGuest();
          }}
          size="lg"
        />
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>
        <Button
          title="Log In"
          icon="mail-outline"
          variant="outline"
          onPress={() => navigation.navigate("Login")}
        />
        <Button
          title="Create Account"
          icon="person-add-outline"
          variant="outline"
          onPress={() => navigation.navigate("Register")}
        />
      </View>

      <Text style={styles.footnote}>
        Guests can scan, split, and share. Create an account to save your splits
        and sync them across devices.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logo: {
    color: colors.textPrimary,
    fontSize: fontSize.display - 4,
    fontWeight: fontWeight.heavy,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  tagline: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    lineHeight: lineHeight.lg,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  footnote: {
    color: colors.textPlaceholder,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
