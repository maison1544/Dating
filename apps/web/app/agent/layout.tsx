import { ScopedProviders } from "../providers";

export default function AgentRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ScopedProviders appScope="agent">{children}</ScopedProviders>;
}
