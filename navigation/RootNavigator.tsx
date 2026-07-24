import {
  DarkTheme,
  NavigationContainer,
  type Theme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../contexts/AuthContext";
import SplashScreen from "../screens/SplashScreen";
import { colors } from "../theme";
import AuthNavigator from "./AuthNavigator";
import MainTabs from "./MainTabs";
import NewSplitNavigator from "./NewSplitNavigator";
import { headerlessStackScreenOptions } from "./screenOptions";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
    notification: colors.danger,
  },
};

export default function RootNavigator() {
  const { isAuthReady, authToken, isGuest } = useAuth();

  if (!isAuthReady) {
    return <SplashScreen />;
  }

  const isSignedIn = Boolean(authToken) || isGuest;

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={headerlessStackScreenOptions}>
        {isSignedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="NewSplit"
              component={NewSplitNavigator}
              options={{ presentation: "modal" }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
