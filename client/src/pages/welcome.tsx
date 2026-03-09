import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Play } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return { text: "Selamat Pagi", icon: "☀️" };
  if (hour < 15) return { text: "Selamat Siang", icon: "🌤️" };
  if (hour < 18) return { text: "Selamat Sore", icon: "🌅" };
  return { text: "Selamat Malam", icon: "🌙" };
}

function formatDate() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Welcome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const greeting = getGreeting();
  const initial = user.username.charAt(0).toUpperCase();

  const handleStart = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[320px] rounded-3xl p-8 flex flex-col items-center gap-5"
        style={{
          background: "radial-gradient(ellipse at top, hsl(var(--card)/0.95) 0%, hsl(var(--background)/0.98) 100%)",
          border: "1px solid hsl(var(--primary)/0.35)",
          boxShadow: "0 0 40px hsl(var(--primary)/0.15), 0 0 80px hsl(var(--primary)/0.05), inset 0 1px 0 hsl(var(--primary)/0.1)",
        }}
        data-testid="card-welcome"
      >
        {/* Decorative top quote marks */}
        <div className="absolute top-4 left-6 text-4xl font-serif text-primary/10 leading-none select-none">"</div>
        <div className="absolute top-4 right-6 text-4xl font-serif text-primary/10 leading-none select-none">"</div>

        {/* Avatar */}
        <div
          className="relative mt-2"
          style={{
            filter: "drop-shadow(0 0 18px hsl(var(--primary)/0.5))",
          }}
        >
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 35% 35%, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
              border: "2.5px solid hsl(var(--primary)/0.7)",
              boxShadow: "0 0 0 4px hsl(var(--primary)/0.1), 0 0 20px hsl(var(--primary)/0.3)",
            }}
            data-testid="avatar-welcome"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span
                className="text-4xl font-bold"
                style={{ color: "hsl(var(--primary))" }}
              >
                {initial}
              </span>
            )}
          </div>
        </div>

        {/* Greeting Text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2" data-testid="text-greeting">
            <span>{greeting.icon}</span>
            <span>{greeting.text}</span>
          </h2>

          <p
            className="text-base font-semibold tracking-wide"
            style={{ color: "hsl(var(--primary))" }}
            data-testid="text-username-welcome"
          >
            {user.username.toUpperCase()}
          </p>

          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <span>🚀</span>
            <span>Siap bertugas hari ini?</span>
          </p>

          <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5" data-testid="text-date-welcome">
            <span>📅</span>
            <span>{formatDate()}</span>
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleStart}
          className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(45 90% 45%) 100%)",
            color: "hsl(var(--background))",
            boxShadow: "0 4px 20px hsl(var(--primary)/0.4), 0 1px 0 hsl(45 100% 70% / 0.3) inset",
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 28px hsl(var(--primary)/0.55), 0 1px 0 hsl(45 100% 70% / 0.3) inset")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px hsl(var(--primary)/0.4), 0 1px 0 hsl(45 100% 70% / 0.3) inset")}
          data-testid="button-mulai-bertugas"
        >
          <Play className="w-4 h-4 fill-current" />
          Mulai Bertugas
        </button>
      </div>
    </div>
  );
}
