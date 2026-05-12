"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { UserChatNotifications } from "@/components/layout/UserChatNotifications";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <UserChatNotifications />
      <main className="max-w-[1600px] mx-auto">{children}</main>
      <Footer />
    </div>
  );
}
