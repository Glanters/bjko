import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return { text: "Selamat Pagi", icon: "☀️" };
  if (hour < 15) return { text: "Selamat Siang", icon: "🌤️" };
  if (hour < 18) return { text: "Selamat Sore", icon: "🌅" };
  return { text: "Selamat Malam", icon: "🌙" };
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Welcome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const rippleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (rippleRef.current) {
      rippleRef.current.style.animation = "none";
    }
  }, []);

  if (!user) return null;

  const greeting = getGreeting();
  const initial = user.username.charAt(0).toUpperCase();

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) return;

    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = btn.querySelector(".ripple") as HTMLElement;
    if (ripple) {
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      ripple.style.animation = "none";
      void ripple.offsetWidth;
      ripple.style.animation = "btn-ripple 0.6s ease-out forwards";
    }

    setLoading(true);
    setTimeout(() => {
      setExiting(true);
      setTimeout(() => setLocation("/"), 350);
    }, 1100);
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden p-4"
      style={{
        transition: "opacity 0.35s ease",
        opacity: exiting ? 0 : 1,
      }}
    >
      {/* Animated background orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          top: "10%", left: "5%",
          background: "radial-gradient(circle, hsl(var(--primary)/0.12) 0%, transparent 70%)",
          animation: "orb-drift-1 12s ease-in-out infinite",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          bottom: "5%", right: "5%",
          background: "radial-gradient(circle, hsl(45 90% 50% / 0.08) 0%, transparent 70%)",
          animation: "orb-drift-2 15s ease-in-out infinite",
          filter: "blur(50px)",
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          top: "40%", right: "15%",
          background: "radial-gradient(circle, hsl(var(--primary)/0.06) 0%, transparent 70%)",
          animation: "orb-drift-1 18s ease-in-out infinite reverse",
          filter: "blur(60px)",
        }}
      />

      {/* Card */}
      <div
        className="welcome-card-enter relative z-10 w-full max-w-[310px] rounded-3xl pt-10 pb-8 px-8 flex flex-col items-center gap-4"
        style={{
          background: "linear-gradient(160deg, hsl(var(--card)/0.98) 0%, hsl(var(--background)/0.99) 100%)",
          border: "1px solid hsl(var(--primary)/0.4)",
          boxShadow: `
            0 0 0 1px hsl(var(--primary)/0.08),
            0 0 30px hsl(var(--primary)/0.12),
            0 0 80px hsl(var(--primary)/0.06),
            0 24px 60px hsl(0 0% 0% / 0.4),
            inset 0 1px 0 hsl(var(--primary)/0.15)
          `,
        }}
        data-testid="card-welcome"
      >
        {/* Subtle top shimmer line */}
        <div
          className="absolute top-0 left-8 right-8 h-px rounded-full pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.6), transparent)",
          }}
        />

        {/* Corner quote decorations */}
        <div className="absolute top-5 left-5 text-3xl font-serif leading-none select-none" style={{ color: "hsl(var(--primary)/0.15)" }}>"</div>
        <div className="absolute top-5 right-5 text-3xl font-serif leading-none select-none" style={{ color: "hsl(var(--primary)/0.15)" }}>"</div>

        {/* Avatar section */}
        <div className="welcome-fade-up-1 relative flex items-center justify-center">
          {/* Outer decorative ring — slow rotate */}
          <div
            className="absolute w-[116px] h-[116px] rounded-full pointer-events-none"
            style={{
              border: "1px dashed hsl(var(--primary)/0.25)",
              animation: "ring-rotate 20s linear infinite",
            }}
          />
          {/* Inner rotating arc */}
          <div
            className="absolute w-[108px] h-[108px] rounded-full pointer-events-none"
            style={{
              border: "2px solid transparent",
              borderTopColor: "hsl(var(--primary)/0.7)",
              borderRightColor: "hsl(var(--primary)/0.2)",
              animation: "ring-counter-rotate 8s linear infinite",
            }}
          />

          {/* Avatar circle */}
          <div
            className="avatar-float w-[88px] h-[88px] rounded-full overflow-hidden flex items-center justify-center relative z-10 avatar-glow"
            style={{
              background: "radial-gradient(circle at 35% 30%, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
              border: "2px solid hsl(var(--primary)/0.75)",
            }}
            data-testid="avatar-welcome"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold select-none" style={{ color: "hsl(var(--primary))" }}>
                {initial}
              </span>
            )}
          </div>
        </div>

        {/* Greeting */}
        <div className="welcome-fade-up-2 text-center">
          <h2
            className="text-lg font-bold flex items-center justify-center gap-2 mb-0.5"
            style={{ color: "hsl(var(--foreground))" }}
            data-testid="text-greeting"
          >
            <span className="text-xl">{greeting.icon}</span>
            <span>{greeting.text}</span>
          </h2>
        </div>

        {/* Username */}
        <div className="welcome-fade-up-3 text-center -mt-1">
          <p
            className="text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-1.5"
            style={{ color: "hsl(var(--primary))" }}
            data-testid="text-username-welcome"
          >
            <span className="text-base">👤</span>
            <span>{user.username.toUpperCase()}</span>
          </p>
        </div>

        {/* Divider */}
        <div
          className="welcome-fade-up-3 w-16 h-px rounded-full"
          style={{ background: "hsl(var(--primary)/0.25)" }}
        />

        {/* Sub info */}
        <div className="welcome-fade-up-4 text-center space-y-1.5 -mt-1">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <span>🚀</span>
            <span>Siap bertugas hari ini?</span>
          </p>
          <p
            className="text-xs flex items-center justify-center gap-1.5"
            style={{ color: "hsl(var(--muted-foreground)/0.7)" }}
            data-testid="text-date-welcome"
          >
            <span>📅</span>
            <span>{formatDate()}</span>
          </p>
        </div>

        {/* CTA Button */}
        <div className="welcome-fade-up-5 w-full mt-1">
          <button
            onClick={handleStart}
            disabled={loading}
            className="relative w-full overflow-hidden py-3.5 px-6 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2.5 transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? "linear-gradient(135deg, hsl(var(--primary)/0.6) 0%, hsl(45 80% 40%/0.6) 100%)"
                : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(45 90% 45%) 100%)",
              color: "hsl(var(--background))",
              boxShadow: loading
                ? "none"
                : "0 4px 20px hsl(var(--primary)/0.45), inset 0 1px 0 hsl(45 100% 70% / 0.25)",
              transition: "background 0.3s, box-shadow 0.3s, transform 0.15s",
            }}
            data-testid="button-mulai-bertugas"
          >
            {/* Ripple */}
            <span
              className="ripple absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                width: "12px",
                height: "12px",
                background: "hsl(0 0% 100% / 0.4)",
              }}
            />

            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memuat...</span>
              </>
            ) : (
              <>
                <span className="text-base leading-none">▶</span>
                <span>Mulai Bertugas</span>
              </>
            )}
          </button>

          {/* Loading progress bar */}
          {loading && (
            <div className="mt-3 h-0.5 w-full rounded-full overflow-hidden bg-white/5">
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(45 90% 55%))",
                  animation: "loading-bar 1.1s ease-in-out forwards",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
