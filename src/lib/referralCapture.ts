// Capture & hold referral codes from URL during the signup flow.
const STORAGE_KEY = "cm_pending_referral_code";

export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");
  if (ref && /^[A-Za-z0-9-]{4,32}$/.test(ref)) {
    try {
      localStorage.setItem(STORAGE_KEY, ref.toUpperCase());
    } catch {/* ignore */}
  }
}

export function getPendingReferralCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingReferralCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {/* ignore */}
}

export function buildReferralUrl(code: string): string {
  if (typeof window === "undefined") return `https://cashmaatje.com/signup?ref=${code}`;
  return `${window.location.origin}/signup?ref=${encodeURIComponent(code)}`;
}
