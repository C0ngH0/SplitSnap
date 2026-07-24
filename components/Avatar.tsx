import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, fontWeight, radius } from "../theme";

const PALETTE = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Stable per-name color so a participant keeps the same swatch everywhere. */
function colorFor(name: string) {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % PALETTE.length;
  }

  return PALETTE[hash];
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorFor(name),
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>
        {initialsFor(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  text: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
});
