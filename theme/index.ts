/**
 * Design tokens for Tably.
 *
 * Every value here is lifted verbatim from the original single-screen
 * StyleSheet so the redesign inherits the existing palette exactly.
 */

export const colors = {
  /** App background and sunken surfaces inside cards. */
  background: "#0f172a",
  /** Raised card surface. */
  surface: "#1e293b",
  /** Inset surface sitting on top of a card. */
  surfaceSunken: "#0f172a",

  border: "#334155",
  borderStrong: "#475569",

  textPrimary: "#ffffff",
  textBody: "#e2e8f0",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  textPlaceholder: "#64748b",

  primary: "#3b82f6",
  primaryText: "#ffffff",
  primaryLink: "#60a5fa",
  primaryInfo: "#93c5fd",
  primarySurface: "#172554",

  accent: "#22c55e",
  accentText: "#052e16",
  accentSurface: "#14532d",
  accentSurfaceText: "#dcfce7",

  danger: "#f87171",
  dangerBorder: "#991b1b",
  dangerSurface: "#450a0a",
  dangerText: "#fecaca",

  warningBorder: "#f97316",
  warningSurface: "#451a03",
  warningTitle: "#fed7aa",
  warningText: "#ffedd5",

  neutralButton: "#334155",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 17,
  xxl: 18,
  title: 22,
  display: 32,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
} as const;

export const lineHeight = {
  sm: 18,
  md: 20,
  lg: 22,
} as const;

export type Colors = typeof colors;
