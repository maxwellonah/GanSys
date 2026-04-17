import { redirect } from "next/navigation";

import { LandingPage } from "@/components/home/landing-page";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // If already logged in, go straight to dashboard
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <LandingPage />;
}
