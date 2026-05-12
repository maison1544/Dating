import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Dating - 특별한 만남",
  description: "특별한 만남을 시작하세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1f2937",
                border: "1px solid #374151",
                color: "#f3f4f6",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
