// Utilities to keep text readable when background/brand colors change.

export function hexToHsl(hex: string): string | null {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Parse "H S% L%" string -> {h,s,l}
export function parseHsl(value: string): { h: number; s: number; l: number } | null {
  const m = /^\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*$/.exec(value);
  if (!m) return null;
  return { h: +m[1], s: +m[2], l: +m[3] };
}

// Relative luminance from H S% L% (uses HSL->RGB conversion)
function hslToRgb(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) return [l, l, l] as const;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)] as const;
}

function relLuminance(h: number, s: number, l: number): number {
  const [r, g, b] = hslToRgb(h, s, l);
  const ch = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

// Return "0 0% 100%" or "0 0% 7%" depending on luminance for max contrast
export function readableForegroundHsl(bgHsl: string): string {
  const parsed = parseHsl(bgHsl);
  if (!parsed) return "0 0% 100%";
  const lum = relLuminance(parsed.h, parsed.s, parsed.l);
  // WCAG-ish threshold
  return lum > 0.45 ? "0 0% 7%" : "0 0% 100%";
}

// Slightly muted version of foreground for secondary text
export function readableMutedForegroundHsl(bgHsl: string): string {
  const parsed = parseHsl(bgHsl);
  if (!parsed) return "220 9% 64%";
  const lum = relLuminance(parsed.h, parsed.s, parsed.l);
  return lum > 0.45 ? "220 9% 35%" : "220 9% 70%";
}

/**
 * Given any subset of base tokens that were just changed, set matching
 * -foreground tokens so text stays readable.
 */
export function syncForegroundTokens(changes: Partial<Record<
  "--background" | "--card" | "--popover" | "--muted" | "--secondary" |
  "--accent" | "--primary" | "--destructive" | "--sidebar-background" |
  "--sidebar-primary" | "--sidebar-accent",
  string
>>) {
  const root = document.documentElement;
  const map: Record<string, string> = {
    "--background": "--foreground",
    "--card": "--card-foreground",
    "--popover": "--popover-foreground",
    "--muted": "--muted-foreground",
    "--secondary": "--secondary-foreground",
    "--accent": "--accent-foreground",
    "--primary": "--primary-foreground",
    "--destructive": "--destructive-foreground",
    "--sidebar-background": "--sidebar-foreground",
    "--sidebar-primary": "--sidebar-primary-foreground",
    "--sidebar-accent": "--sidebar-accent-foreground",
  };
  for (const [token, value] of Object.entries(changes)) {
    if (!value) continue;
    const fgToken = map[token];
    if (!fgToken) continue;
    const fg = token === "--muted"
      ? readableMutedForegroundHsl(value)
      : readableForegroundHsl(value);
    root.style.setProperty(fgToken, fg);
  }

  // If background changed, also re-derive border/input so they stay visible.
  if (changes["--background"]) {
    const p = parseHsl(changes["--background"]!);
    if (p) {
      const isDark = relLuminance(p.h, p.s, p.l) <= 0.45;
      const border = isDark ? "0 0% 18%" : "0 0% 92%";
      root.style.setProperty("--border", border);
      root.style.setProperty("--input", border);
    }
  }
}
