"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/**
 * Privacy-friendly page analytics. Provider, script URL and site id all have to
 * be set before anything is requested, so local development and a fresh deploy
 * send nothing to a third party.
 *
 *   NEXT_PUBLIC_ANALYTICS_PROVIDER=umami | plausible | goatcounter
 *   NEXT_PUBLIC_ANALYTICS_SRC=https://analytics.example.com/script.js
 *   NEXT_PUBLIC_ANALYTICS_ID=<website id / domain>
 */
const PROVIDER = (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || "")
  .trim()
  .toLowerCase();
const SRC = (process.env.NEXT_PUBLIC_ANALYTICS_SRC || "").trim();
const ID = (process.env.NEXT_PUBLIC_ANALYTICS_ID || "").trim();

const ATTRIBUTE = {
  umami: "data-website-id",
  plausible: "data-domain",
  goatcounter: "data-goatcounter",
};

export default function Analytics() {
  const pathname = usePathname();
  const landed = useRef(true);

  useEffect(() => {
    // The script counts the landing page itself, so only later client-side
    // navigations are reported here. Umami and GoatCounter follow the history
    // API on their own and would double-count.
    if (landed.current) {
      landed.current = false;
      return;
    }
    if (PROVIDER === "plausible") window.plausible?.("pageview");
  }, [pathname]);

  const attribute = ATTRIBUTE[PROVIDER];
  if (!attribute || !SRC || !ID) return null;

  return (
    <Script src={SRC} strategy="afterInteractive" {...{ [attribute]: ID }} />
  );
}
