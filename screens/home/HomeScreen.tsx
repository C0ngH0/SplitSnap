import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import {
  Banner,
  EmptyState,
  ListCard,
  Screen,
  SectionHeader,
} from "../../components";
import { SplitListItem } from "../../components/SplitListItem";
import { useAuth } from "../../contexts/AuthContext";
import { useSavedSplits } from "../../contexts/SavedSplitsContext";
import { useSplitDraft } from "../../contexts/SplitDraftContext";
import type { HomeStackParamList } from "../../navigation/types";
import {
  colors,
  fontWeight,
  radius,
  shadows,
  spacing,
  typography,
} from "../../theme";

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
        <Text style={styles.logo}>Tably</Text>
        <Text style={styles.tagline}>Split bills. Fairly and easily.</Text>
      </View>

      <ListCard
        onPress={startNewSplit}
        accessibilityLabel="Start a new split"
        style={styles.cta}
      >
        <View style={styles.ctaRow}>
          <View style={styles.ctaIcon}>
            <Ionicons name="camera" size={22} color={colors.primaryText} />
          </View>
          <View style={styles.ctaText}>
            <Text style={styles.ctaTitle}>New Split</Text>
            <Text style={styles.ctaSubtitle}>
              Scan a receipt or add manually
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.primaryText}
          />
        </View>
      </ListCard>

      <ListCard
        onPress={openSplits}
        accessibilityLabel="Saved Splits"
        style={styles.secondaryCard}
      >
        <View style={styles.secondaryRow}>
          <View style={styles.ctaText}>
            <Text style={styles.secondaryTitle}>Saved Splits</Text>
            <Text style={styles.secondarySubtitle}>View your past splits</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        </View>
      </ListCard>

      <SectionHeader
        title="Recent Splits"
        actionLabel={recentSessions.length > 0 ? "View all" : undefined}
        onAction={recentSessions.length > 0 ? openSplits : undefined}
        style={styles.sectionHeader}
      />

      {!authToken ? (
        <EmptyState
          icon="person-outline"
          title={isGuest ? "You are browsing as a guest" : "Not signed in"}
          description="Splits you calculate now are not saved. Create an account from the Profile tab to keep them and sync across devices."
        />
      ) : savedSplits.error ? (
        <Banner tone="error" message={savedSplits.error} />
      ) : recentSessions.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No splits yet"
          description="Scan a receipt and we will automatically extract the items for you."
        />
      ) : (
        <View style={styles.list}>
          {recentSessions.map((session) => (
            <SplitListItem
              key={session.id}
              session={session}
              onPress={() =>
                navigation.getParent()?.navigate("SplitsTab", {
                  screen: "SplitDetail",
                  params: { sessionId: session.id },
                  // Keep SplitsList under detail so delete/back return to the list.
                  initial: false,
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
    marginBottom: spacing.xl,
  },
  logo: {
    ...typography.display,
  },
  tagline: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  cta: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.card,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  ctaText: {
    flex: 1,
    gap: spacing.xs,
  },
  ctaTitle: {
    color: colors.primaryText,
    fontSize: typography.section.fontSize,
    fontWeight: fontWeight.bold,
  },
  ctaSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: typography.caption.fontSize,
  },
  secondaryCard: {
    marginTop: spacing.md,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  secondaryTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  secondarySubtitle: {
    ...typography.caption,
  },
  sectionHeader: {
    marginTop: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  signedInAs: {
    ...typography.caption,
    color: colors.textPlaceholder,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
