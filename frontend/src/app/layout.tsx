import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "SecHindsight — A Cybersecurity SOC Copilot That Learns From Every Incident",
  description: "Enterprise memory-powered cybersecurity incident response and defensive copilot platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#080616] text-[#E2E8F0]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
