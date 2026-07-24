import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Banner, Card, Screen } from "../../components";
import { SplitListItem } from "../../components/SplitListItem";
import { useAuth } from "../../contexts/AuthContext";
import { useSavedSplits } from "../../contexts/SavedSplitsContext";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { HomeStackParamList } from "../../navigation/types";
import { colors, fontSize, fontWeight, lineHeight, radius, spacing } from "../../theme";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

const RECENT_LIMIT = 3;

export default function HomeScreen({}: Props) {
  const navigation = useNavigation();
  const { authToken, isGuest, user } = useAuth();
  const savedSplits = useSavedSplits();
  const draft = useSplitDraft();

  const recentSessions = savedSplits.sessions.slice(0, RECENT_LIMIT);

  const startNewSplit = () => {
    draft.reset();
    navigation.getParent()?.getParent()?.navigate("NewSplit");
  };

  const openSplits = () => navigation.getParent()?.navigate("SplitsTab");

  return (
    <Screen edgeTop>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.logo}>Tably</Text>
          <Text style={styles.tagline}>Split bills. Fairly and easily.</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.cta}
        onPress={startNewSplit}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Start a new split"
      >
        <View style={styles.ctaIcon}>
          <Ionicons name="camera" size={22} color={colors.primaryText} />
        </View>
        <View style={styles.ctaText}>
          <Text style={styles.ctaTitle}>New Split</Text>
          <Text style={styles.ctaSubtitle}>Scan a receipt or add manually</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.primaryText}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryCard}
        onPress={openSplits}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <View style={styles.secondaryIcon}>
          <Ionicons
            name="bookmark-outline"
            size={18}
            color={colors.accent}
          />
        </View>
        <View style={styles.ctaText}>
          <Text style={styles.secondaryTitle}>Saved Splits</Text>
          <Text style={styles.secondarySubtitle}>
            View your past splits
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Splits</Text>
        {recentSessions.length > 0 ? (
          <TouchableOpacity onPress={openSplits}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!authToken ? (
        <Card>
          <Text style={styles.guestTitle}>
            {isGuest ? "You are browsing as a guest" : "Not signed in"}
          </Text>
          <Text style={styles.guestBody}>
            Splits you calculate now are not saved. Create an account from the
            Profile tab to keep them and sync across devices.
          </Text>
        </Card>
      ) : savedSplits.error ? (
        <Banner tone="error" message={savedSplits.error} />
      ) : recentSessions.length === 0 ? (
        <Card>
          <Text style={styles.guestTitle}>No splits yet</Text>
          <Text style={styles.guestBody}>
            Scan a receipt and we will automatically extract the items for you.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {recentSessions.map((session) => (
            <SplitListItem
              key={session.id}
              session={session}
              onPress={() =>
                navigation
                  .getParent()
                  ?.navigate("SplitsTab", {
                    screen: "SplitDetail",
                    params: { sessionId: session.id },
                  })
              }
            />
          ))}
        </View>
      )}

      {user?.email ? (
        <Text style={styles.signedInAs}>Signed in as {user.email}</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xxl,
  },
  headerText: {
    flex: 1,
  },
  logo: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    color: colors.primaryText,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  ctaSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: fontSize.sm,
    marginTop: spacing.xs / 2,
  },
  secondaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  secondaryIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSunken,
  },
  secondaryTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  secondarySubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs / 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  viewAll: {
    color: colors.primaryLink,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  list: {
    gap: spacing.sm,
  },
  guestTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  guestBody: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  signedInAs: {
    color: colors.textPlaceholder,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
});
