"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { UserChatNotifications } from "@/components/layout/UserChatNotifications";
import { ScopedProviders } from "../providers";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScopedProviders appScope="user">
      <div className="min-h-screen bg-black">
        <Header />
        <UserChatNotifications />
        <main className="max-w-[1600px] mx-auto">{children}</main>
        <Footer />
      </div>
    </ScopedProviders>
  );
}
