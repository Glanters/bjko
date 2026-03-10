import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export function NavigationProgress() {
  const [location] = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setProgress(0);
    setVisible(true);

    let current = 0;
    const animate = () => {
      current += (85 - current) * 0.08;
      setProgress(current);
      if (current < 84) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    timerRef.current = setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [location]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-primary transition-all ease-out rounded-r-full shadow-[0_0_8px_2px] shadow-primary/60"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "80ms",
        }}
      />
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [phase, setPhase] = useState<"enter" | "idle">("idle");

  useEffect(() => {
    if (location === displayLocation) return;
    setPhase("enter");
    setDisplayLocation(location);
    const t = setTimeout(() => setPhase("idle"), 350);
    return () => clearTimeout(t);
  }, [location]);

  return (
    <div
      key={displayLocation}
      className={phase === "enter" ? "page-enter" : ""}
      style={{ minHeight: "100%" }}
    >
      {children}
    </div>
  );
}
