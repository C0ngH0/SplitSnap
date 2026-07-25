import {
  DarkTheme,
  NavigationContainer,
  StackActions,
  useNavigationContainerRef,
  type Theme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useRef, type MutableRefObject } from "react";

import { useAuth, type PendingAuthAction } from "../contexts/AuthContext";
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
  const {
    isAuthReady,
    authToken,
    isGuest,
    pendingAuthAction,
    clearPendingAuthAction,
  } = useAuth();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const pendingAuthOpenedRef = useRef(false);

  if (!isAuthReady) {
    return <SplashScreen />;
  }

  const isSignedIn = Boolean(authToken) || isGuest;

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onStateChange={() => {
        // Guest dismissed AuthModal without signing in — clear the pending flag.
        if (
          pendingAuthAction !== "returnToSaveSplit" ||
          authToken ||
          !pendingAuthOpenedRef.current
        ) {
          return;
        }

        const rootState = navigationRef.getRootState();
        const currentRoute = rootState?.routes[rootState.index]?.name;
        if (currentRoute !== "AuthModal") {
          pendingAuthOpenedRef.current = false;
          clearPendingAuthAction();
        }
      }}
    >
      <SignedInAuthEffects
        authToken={authToken}
        pendingAuthAction={pendingAuthAction}
        navigationRef={navigationRef}
        pendingAuthOpenedRef={pendingAuthOpenedRef}
        clearPendingAuthAction={clearPendingAuthAction}
      />
      <Stack.Navigator screenOptions={headerlessStackScreenOptions}>
        {isSignedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="NewSplit"
              component={NewSplitNavigator}
              options={{
                presentation: "modal",
                // Required when NewSplit uses usePreventRemove on native-stack.
                headerBackButtonMenuEnabled: false,
              }}
            />
            {/*
              Distinct from logged-out "Auth" so Continue as Guest resets to Main
              instead of preserving the Welcome route name across the switch.
            */}
            <Stack.Screen
              name="AuthModal"
              component={AuthNavigator}
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

type SignedInAuthEffectsProps = {
  authToken: string | null;
  pendingAuthAction: PendingAuthAction | null;
  navigationRef: ReturnType<typeof useNavigationContainerRef<RootStackParamList>>;
  pendingAuthOpenedRef: MutableRefObject<boolean>;
  clearPendingAuthAction: () => void;
};

/**
 * Dismiss the root AuthModal while preserving Main + NewSplit (including Results).
 * A bare StackActions.pop() / goBack() can resolve against the nested Auth stack
 * (Login → Welcome). Targeting `rootState.key` forces the pop on the root stack.
 */
function dismissRootAuthModal(
  navigationRef: SignedInAuthEffectsProps["navigationRef"],
) {
  const rootState = navigationRef.getRootState();
  if (!rootState) {
    return;
  }

  const authModalIndex = rootState.routes.findIndex(
    (route) => route.name === "AuthModal",
  );

  if (authModalIndex < 0) {
    return;
  }

  const routesToPop = rootState.routes.length - authModalIndex;
  navigationRef.dispatch({
    ...StackActions.pop(routesToPop),
    target: rootState.key,
  });
}

function SignedInAuthEffects({
  authToken,
  pendingAuthAction,
  navigationRef,
  pendingAuthOpenedRef,
  clearPendingAuthAction,
}: SignedInAuthEffectsProps) {
  useEffect(() => {
    if (!navigationRef.isReady()) {
      return;
    }

    if (pendingAuthAction !== "returnToSaveSplit") {
      pendingAuthOpenedRef.current = false;
      return;
    }

    // Login/register succeeded for the pending save flow.
    if (authToken) {
      dismissRootAuthModal(navigationRef);
      pendingAuthOpenedRef.current = false;
      clearPendingAuthAction();
      return;
    }

    if (!pendingAuthOpenedRef.current) {
      pendingAuthOpenedRef.current = true;
      // Open Login directly — skip Welcome for the save-sign-in path.
      navigationRef.navigate("AuthModal", { screen: "Login" });
    }
  }, [
    authToken,
    clearPendingAuthAction,
    navigationRef,
    pendingAuthAction,
    pendingAuthOpenedRef,
  ]);

  return null;
}
