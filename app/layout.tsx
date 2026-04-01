import type { Metadata } from "next";

import { seedDemoData } from "@/lib/data";

import "./globals.css";

export const metadata: Metadata = {
  title: "GanSystems Dashboard",
  description: "Solar-powered smart water and irrigation management dashboard for GanSystems.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (process.env.NODE_ENV !== "production" || process.env.SEED_DEMO_DATA === "true") {
    seedDemoData();
  }

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
