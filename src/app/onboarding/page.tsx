import type { Metadata } from "next";
import { Suspense } from "react";
import OnboardingWizard, { OnboardingHeader } from "./OnboardingWizard";

export const metadata: Metadata = {
  title: "Get Started — Onboarding",
  description:
    "Set up your AI WhatsApp assistant in minutes. Tell us about your business, train your assistant, and go live.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;

  return (
    <div className="min-h-screen bg-app relative overflow-x-clip">
      {/* ambient decoration */}
      <div className="glow-orb w-[480px] h-[480px] bg-brand-teal -top-40 -start-40" />
      <div className="glow-orb w-[420px] h-[420px] bg-brand-navy bottom-0 -end-32" />
      <div className="grid-bg absolute inset-0 opacity-30 pointer-events-none" />

      <div className="relative z-10">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="skeleton w-full max-w-3xl h-96 mx-4" />
            </div>
          }
        >
          <OnboardingHeader />
          <OnboardingWizard initialPlan={plan ?? null} />
        </Suspense>
      </div>
    </div>
  );
}
