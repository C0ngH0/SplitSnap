import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import { colors, fontSize, fontWeight } from "../theme";

export const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

export const headerlessStackScreenOptions: NativeStackNavigationOptions = {
  ...stackScreenOptions,
  headerShown: false,
};
