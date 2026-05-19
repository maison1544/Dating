"use client";

import { AlertProvider } from "@/contexts/AlertContext";
import { AppScopeProvider } from "@/contexts/AppScopeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ChatProfileProvider } from "@/contexts/ChatProfileContext";
import type { AppInstance } from "@/lib/supabase/config";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AlertProvider>{children}</AlertProvider>;
}

export function ScopedProviders({
  appScope,
  children,
}: {
  appScope: AppInstance;
  children: React.ReactNode;
}) {
  return (
    <AppScopeProvider appScope={appScope}>
      <NotificationProvider>
        <AuthProvider appScope={appScope}>
          <ProfileProvider>
            <ChatProfileProvider>{children}</ChatProfileProvider>
          </ProfileProvider>
        </AuthProvider>
      </NotificationProvider>
    </AppScopeProvider>
  );
}
