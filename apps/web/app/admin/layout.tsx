import { ScopedProviders } from "../providers";

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ScopedProviders appScope="admin">{children}</ScopedProviders>;
}
