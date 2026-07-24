import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Avatar, Banner, Button, Card, Screen } from "../../components";
import { useAuth } from "../../contexts/AuthContext";
import { useSavedSplits } from "../../contexts/SavedSplitsContext";
import type { ProfileStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, lineHeight, radius, spacing } from "../../theme";
import { formatCurrency } from "../../utils/format";

type Props = NativeStackScreenProps<ProfileStackParamList, "Profile">;

export default function ProfileScreen({}: Props) {
  const { authToken, user, isGuest, logout, exitGuest, status } = useAuth();
  const savedSplits = useSavedSplits();

  const confirmLogout = () => {
    Alert.alert("Log out?", "You can log back in at any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => void logout(),
      },
    ]);
  };

  const totalSplitValue = savedSplits.sessions.reduce(
    (sum, session) => sum + session.summary.finalTotal,
    0,
  );

  return (
    <Screen>
      <View style={styles.hero}>
        {authToken && user?.email ? (
          <Avatar name={user.displayName || user.email} size={72} />
        ) : (
          <View style={styles.guestAvatar}>
            <Ionicons
              name="person-outline"
              size={30}
              color={colors.textMuted}
            />
          </View>
        )}
        <Text style={styles.name}>
          {authToken ? user?.displayName || user?.email || "Your account" : "Guest"}
        </Text>
        {authToken && user?.displayName && user.email ? (
          <Text style={styles.email}>{user.email}</Text>
        ) : null}
      </View>

      {status ? <Banner tone="success" message={status} /> : null}

      {authToken ? (
        <>
          <Card style={styles.card}>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {savedSplits.sessions.length}
                </Text>
                <Text style={styles.statLabel}>Saved splits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatCurrency(totalSplitValue)}
                </Text>
                <Text style={styles.statLabel}>Total split</Text>
              </View>
            </View>
          </Card>

          <Button
            title="Log Out"
            icon="log-out-outline"
            variant="danger"
            onPress={confirmLogout}
          />
        </>
      ) : (
        <>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Create an account</Text>
            <Text style={styles.cardBody}>
              You are using Tably as a guest. Scanning, splitting, and sharing
              all work, but your splits are not saved anywhere.
            </Text>
          </Card>

          <Button
            title="Sign in or create an account"
            icon="log-in-outline"
            size="lg"
            onPress={() => {
              if (isGuest) {
                void exitGuest();
              }
            }}
          />
        </>
      )}

      <Text style={styles.version}>Tably v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  guestAvatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  email: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xs / 2,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs / 2,
  },
  version: {
    color: colors.textPlaceholder,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.xxxl,
  },
});
