"use client";
import { SignupPage } from "@/components/pages/SignupPage";
import { ScopedProviders } from "../providers";

export default function SignupRoute() {
  return (
    <ScopedProviders appScope="user">
      <SignupPage />
    </ScopedProviders>
  );
}
