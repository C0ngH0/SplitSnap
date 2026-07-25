/**
 * Design tokens for Tably.
 *
 * Color hierarchy:
 * - primary: main actions (Continue, Save, New Split)
 * - accent: money, success, and positive totals
 * - outline / ghost: secondary actions
 * - danger: destructive only
 */

export const colors = {
  /** App canvas — true black. */
  background: "#000000",
  /** Raised card / list surface (charcoal, not pure black). */
  surface: "#111827",
  /** Inset wells on cards (inputs, chips). */
  surfaceSunken: "#030712",

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

/** 8-point spacing scale: 4, 8, 12, 16, 24, 32. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  /** @deprecated Use `xxl`. Kept so untouched screens keep compiling. */
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  /** Standard card / list-card radius. */
  lg: 16,
  xl: 24,
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
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  heavy: "800" as const,
};

export const lineHeight = {
  sm: 18,
  md: 22,
  lg: 28,
  display: 38,
} as const;

/**
 * Typography roles (system font). Prefer these over one-off fontSize picks
 * in screens touched by the polish pass.
 */
export const typography = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
    lineHeight: lineHeight.display,
    color: colors.textPrimary,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.lg,
    color: colors.textPrimary,
  },
  section: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.lg,
    color: colors.textPrimary,
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.md,
    color: colors.textBody,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
  },
} as const;

/** Restrained depth for raised cards. */
export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

export type Colors = typeof colors;
