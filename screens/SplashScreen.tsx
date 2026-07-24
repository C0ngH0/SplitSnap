import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, spacing } from "../theme";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Tably</Text>
      <Text style={styles.tagline}>Split bills. Fairly and easily.</Text>
      <ActivityIndicator
        style={styles.spinner}
        color={colors.primary}
        size="small"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  logo: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    marginTop: spacing.sm,
  },
  spinner: {
    marginTop: spacing.xxl,
  },
});
