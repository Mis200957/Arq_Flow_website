"use client";

/* ============================================================
   ArqFlow — Capabilities context
   ------------------------------------------------------------
   Makes the active plan's capabilities available to any dashboard
   client component without prop drilling. Provided once by the
   DashboardShell; consumed by overview quick actions, AI settings,
   analytics teasers, etc.

   Default = full (top-tier) capabilities, so any component rendered
   outside the provider behaves ungated (backward compatible).
   ============================================================ */

import { createContext, useContext } from "react";
import type { Capabilities } from "./capabilities";
import { defaultCapabilitiesForTier } from "./capabilities";

const CapabilitiesContext = createContext<Capabilities>(defaultCapabilitiesForTier(3));

export function CapabilitiesProvider({
  value,
  children,
}: {
  value: Capabilities;
  children: React.ReactNode;
}) {
  return <CapabilitiesContext.Provider value={value}>{children}</CapabilitiesContext.Provider>;
}

export function useCapabilities(): Capabilities {
  return useContext(CapabilitiesContext);
}
