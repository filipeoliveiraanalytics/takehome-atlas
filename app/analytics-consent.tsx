"use client";

import { useEffect, useState } from "react";

const MEASUREMENT_ID = "G-97FY7CRQJ8";
const STORAGE_KEY = "takehome-atlas-analytics-consent";

type ConsentChoice = "accepted" | "declined";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function startAnalytics() {
  if (document.querySelector(`script[data-ga-id="${MEASUREMENT_ID}"]`)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  script.dataset.gaId = MEASUREMENT_ID;
  document.head.appendChild(script);
}

export default function AnalyticsConsent() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const savedChoice = stored === "accepted" || stored === "declined" ? stored : null;
    setChoice(savedChoice);
    if (savedChoice === "accepted") startAnalytics();
  }, []);

  function choose(nextChoice: ConsentChoice) {
    window.localStorage.setItem(STORAGE_KEY, nextChoice);
    setChoice(nextChoice);
    if (nextChoice === "accepted") startAnalytics();
    if (nextChoice === "declined" && window.gtag) {
      window.gtag("consent", "update", { analytics_storage: "denied" });
      window.location.reload();
    }
  }

  return (
    <>
      {choice === null ? (
        <section className="consentBanner" aria-label="Analytics cookie preferences">
          <div>
            <b>Your privacy, your choice</b>
            <p>
              We use optional Google Analytics cookies to understand how Takehome Atlas is used and improve the calculator. No analytics is loaded unless you accept.
            </p>
          </div>
          <div className="consentActions">
            <button type="button" className="consentDecline" onClick={() => choose("declined")}>Decline</button>
            <button type="button" className="consentAccept" onClick={() => choose("accepted")}>Accept analytics</button>
          </div>
        </section>
      ) : (
        <button type="button" className="consentSettings" onClick={() => setChoice(null)}>
          Privacy settings
        </button>
      )}
    </>
  );
}
