"use client";

import { ReactNode } from "react";
import { AlertProvider } from "@/contexts/AlertContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ChatProfileProvider } from "@/contexts/ChatProfileContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AlertProvider>
      <NotificationProvider>
        <AuthProvider>
          <ProfileProvider>
            <ChatProfileProvider>{children}</ChatProfileProvider>
          </ProfileProvider>
        </AuthProvider>
      </NotificationProvider>
    </AlertProvider>
  );
}
