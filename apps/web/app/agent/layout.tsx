"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";

export default function AgentRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
