"use client";

import { LoginPage } from "@/components/pages/LoginPage";
import { ScopedProviders } from "../providers";

export default function LoginRoute() {
  return (
    <ScopedProviders appScope="user">
      <LoginPage />
    </ScopedProviders>
  );
}
