import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string } | undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type SplitsStackParamList = {
  SplitsList: undefined;
  SplitDetail: { sessionId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SplitsTab: NavigatorScreenParams<SplitsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type NewSplitStackParamList = {
  ReceiptSource: undefined;
  ReceiptReview: undefined;
  ModeStep: undefined;
  Participants: undefined;
  Items: undefined;
  BillTotal: undefined;
  TaxTip: undefined;
  Results: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  NewSplit: NavigatorScreenParams<NewSplitStackParamList>;
  /**
   * Guest "Sign in to save" modal only. Must not share the Auth route name —
   * otherwise Continue as Guest keeps the logged-out Auth screen instead of Main.
   */
  AuthModal: NavigatorScreenParams<AuthStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
