import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function hslToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return `#${[r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}

export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
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

function parseHsl(hsl: string): [number, number, number] {
  const parts = hsl.trim().split(/\s+/);
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  return [h, s, l];
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function hsl(h: number, s: number, l: number) {
  return `${Math.round(h)} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%`;
}

const THEME_CSS_VARS_KEY = "theme_css_vars";

const ALL_CUSTOM_VARS = [
  "--background","--foreground","--card","--card-foreground","--popover","--popover-foreground",
  "--secondary","--secondary-foreground","--muted","--muted-foreground",
  "--border","--input","--ring","--sidebar-background","--sidebar-foreground","--sidebar-border",
  "--primary","--primary-foreground","--accent","--accent-foreground",
  "--sidebar-primary","--sidebar-primary-foreground","--sidebar-accent","--sidebar-accent-foreground",
];

export function applyCustomColors(bg: string | null | undefined, primary: string | null | undefined) {
  const root = document.documentElement;

  if (bg && bg.trim()) {
    const [h, s, l] = parseHsl(bg);
    const ls = clamp(s + 10, 0, 100);

    root.style.setProperty("--background", hsl(h, s, l));
    root.style.setProperty("--foreground", hsl(h, clamp(s - 20, 0, 30), clamp(l + 72, 0, 100)));

    root.style.setProperty("--card", hsl(h, ls, clamp(l + 6, 0, 100)));
    root.style.setProperty("--card-foreground", hsl(h, clamp(s - 20, 0, 30), clamp(l + 72, 0, 100)));

    root.style.setProperty("--popover", hsl(h, s, l));
    root.style.setProperty("--popover-foreground", hsl(h, clamp(s - 20, 0, 30), clamp(l + 72, 0, 100)));

    root.style.setProperty("--secondary", hsl(h, ls, clamp(l + 12, 0, 100)));
    root.style.setProperty("--secondary-foreground", hsl(h, clamp(s - 20, 0, 30), clamp(l + 72, 0, 100)));

    root.style.setProperty("--muted", hsl(h, s, clamp(l + 8, 0, 100)));
    root.style.setProperty("--muted-foreground", hsl(h, clamp(s - 10, 0, 60), clamp(l + 50, 0, 100)));

    root.style.setProperty("--border", hsl(h, ls, clamp(l + 12, 0, 100)));
    root.style.setProperty("--input", hsl(h, s, clamp(l + 4, 0, 100)));
    root.style.setProperty("--ring", primary && primary.trim() ? primary : hsl(h, clamp(s + 50, 0, 100), clamp(l + 38, 0, 100)));

    root.style.setProperty("--sidebar-background", hsl(h, ls, clamp(l + 6, 0, 100)));
    root.style.setProperty("--sidebar-foreground", hsl(h, clamp(s - 20, 0, 30), clamp(l + 72, 0, 100)));
    root.style.setProperty("--sidebar-border", hsl(h, ls, clamp(l + 12, 0, 100)));
  } else {
    const vars = [
      "--background","--foreground","--card","--card-foreground","--popover","--popover-foreground",
      "--secondary","--secondary-foreground","--muted","--muted-foreground",
      "--border","--input","--ring","--sidebar-background","--sidebar-foreground","--sidebar-border"
    ];
    vars.forEach(v => root.style.removeProperty(v));
  }

  if (primary && primary.trim()) {
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--accent", primary);

    const bg2 = bg && bg.trim() ? bg : "211 43% 12%";
    const [bh, bs, bl] = parseHsl(bg2);
    root.style.setProperty("--primary-foreground", hsl(bh, bs, bl));
    root.style.setProperty("--accent-foreground", hsl(bh, bs, bl));
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty("--sidebar-primary-foreground", hsl(bh, bs, bl));
    root.style.setProperty("--sidebar-accent", primary);
    root.style.setProperty("--sidebar-accent-foreground", hsl(bh, bs, bl));
    root.style.setProperty("--ring", primary);
  } else {
    const vars2 = [
      "--primary","--primary-foreground","--accent","--accent-foreground",
      "--sidebar-primary","--sidebar-primary-foreground","--sidebar-accent","--sidebar-accent-foreground"
    ];
    vars2.forEach(v => root.style.removeProperty(v));
  }

  // Cache computed CSS vars to localStorage so the inline script can apply them on next load (no FOUC)
  if ((bg && bg.trim()) || (primary && primary.trim())) {
    const cached: Record<string, string> = {};
    ALL_CUSTOM_VARS.forEach(v => {
      const val = root.style.getPropertyValue(v);
      if (val) cached[v] = val;
    });
    try { localStorage.setItem(THEME_CSS_VARS_KEY, JSON.stringify(cached)); } catch (_) {}
  } else {
    try { localStorage.removeItem(THEME_CSS_VARS_KEY); } catch (_) {}
  }
}

export function applyBgImage(bgImage: string | null | undefined) {
  const root = document.documentElement;
  if (bgImage && bgImage.trim()) {
    root.style.setProperty("--bg-image", `url(${bgImage})`);
    try { localStorage.setItem("theme_bg_image", bgImage); } catch (_) {}
  } else {
    root.style.removeProperty("--bg-image");
    try { localStorage.removeItem("theme_bg_image"); } catch (_) {}
  }
}

export function ThemeApplier() {
  const { data } = useQuery<{ bg: string | null; primary: string | null; bgImage: string | null }>({
    queryKey: ["/api/theme-settings"],
    staleTime: 0,
  });

  useEffect(() => {
    if (data) {
      applyCustomColors(data.bg, data.primary);
      applyBgImage(data.bgImage);
    }
  }, [data]);

  return null;
}
