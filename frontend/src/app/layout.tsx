import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "SecHindsight — A Cybersecurity SOC Copilot That Learns From Every Incident",
  description: "Memory-powered cybersecurity incident response and defensive copilot system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[#B7C396]/30 selection:text-[#1D211C]">
        <div className="atmosphere-bg" />
        <Navbar />
        <div className="flex max-w-[1600px] mx-auto min-h-[calc(100vh-57px)]">
          <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
