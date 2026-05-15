"use client";

import AuthPage from "../login/page";

export default function SignupPage() {
  // Since the component handles both, we can just wrap it or have it handle a default state.
  // However, the AuthPage currently has internal state for isLogin.
  // I'll modify AuthPage to accept an initial state prop.
  return <AuthPage initialIsLogin={false} />;
}
