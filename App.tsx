import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Providers } from "./contexts/Providers";
import RootNavigator from "./navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <Providers>
        <StatusBar style="light" />
        <RootNavigator />
      </Providers>
    </SafeAreaProvider>
  );
}
