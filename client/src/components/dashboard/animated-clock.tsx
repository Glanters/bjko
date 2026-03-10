import { useState, useEffect } from "react";

function useThemeColors() {
  const [colors, setColors] = useState({
    primary: "#3b82f6",
    primaryHsl: "210 95% 50%",
    bg: "#0a0f1e",
    card: "#0d1b2a",
    muted: "rgba(148,163,184,0.6)",
  });

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const primaryHsl = style.getPropertyValue("--primary").trim() || "210 95% 50%";
      const bgHsl = style.getPropertyValue("--background").trim() || "211 43% 12%";
      const cardHsl = style.getPropertyValue("--card").trim() || "211 53% 18%";
      const mutedHsl = style.getPropertyValue("--muted-foreground").trim() || "210 30% 65%";
      setColors({
        primary: `hsl(${primaryHsl})`,
        primaryHsl,
        bg: `hsl(${bgHsl})`,
        card: `hsl(${cardHsl})`,
        muted: `hsl(${mutedHsl})`,
      });
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}

export function AnimatedClock() {
  const [time, setTime] = useState(new Date());
  const { primary, primaryHsl, bg, card, muted } = useThemeColors();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayName = dayNames[time.getDay()];
  const dateStr = `${time.getDate()} ${monthNames[time.getMonth()]} ${time.getFullYear()}`;

  const pad = (n: number) => String(n).padStart(2, "0");
  const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const isPM = hours >= 12;
  const period = isPM ? "PM" : "AM";

  const cx = 100;
  const cy = 100;
  const r = 88;

  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);

  const handTip = (deg: number, len: number) => ({
    x: cx + len * Math.cos(toRad(deg)),
    y: cy + len * Math.sin(toRad(deg)),
  });

  const handTail = (deg: number, len: number) => ({
    x: cx + len * Math.cos(toRad(deg + 180)),
    y: cy + len * Math.sin(toRad(deg + 180)),
  });

  const hourTip = handTip(hourDeg, 52);
  const hourTail = handTail(hourDeg, 10);
  const minuteTip = handTip(minuteDeg, 68);
  const minuteTail = handTail(minuteDeg, 12);
  const secondTip = handTip(secondDeg, 76);
  const secondTail = handTail(secondDeg, 18);

  const hourMarkers = Array.from({ length: 60 }, (_, i) => {
    const deg = i * 6;
    const rad = toRad(deg);
    const isHour = i % 5 === 0;
    const isQuarter = i % 15 === 0;
    const outer = r;
    const inner = isQuarter ? r - 18 : isHour ? r - 12 : r - 6;
    return {
      x1: cx + inner * Math.cos(rad),
      y1: cy + inner * Math.sin(rad),
      x2: cx + outer * Math.cos(rad),
      y2: cy + outer * Math.sin(rad),
      isHour,
      isQuarter,
      active: i === seconds,
    };
  });

  const romanNumerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

  const primaryRgba = (opacity: number) => `hsl(${primaryHsl} / ${opacity})`;

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, ${card} 50%, ${bg} 100%)`,
        border: `1px solid ${primaryRgba(0.2)}`,
        boxShadow: `0 0 40px ${primaryRgba(0.08)}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
      data-testid="widget-clock"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${primaryRgba(0.06)} 0%, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 p-6 flex flex-col items-center gap-4">
        <div className="relative" style={{ filter: `drop-shadow(0 0 20px ${primaryRgba(0.3)})` }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <defs>
              <radialGradient id="faceGrad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor={card} />
                <stop offset="100%" stopColor={bg} />
              </radialGradient>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={primary} stopOpacity="0.9" />
                <stop offset="100%" stopColor={primary} stopOpacity="1" />
              </radialGradient>
              <linearGradient id="hourGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="minuteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer decorative rings */}
            <circle cx={cx} cy={cy} r={r + 9} fill="none" stroke={primaryRgba(0.06)} strokeWidth="1" />
            <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={primaryRgba(0.12)} strokeWidth="0.5" />
            <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={primaryRgba(0.2)} strokeWidth="1" />

            {/* Clock face */}
            <circle cx={cx} cy={cy} r={r} fill="url(#faceGrad)" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={primaryRgba(0.35)} strokeWidth="1.5" />

            {/* Inner subtle ring */}
            <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke={primaryRgba(0.08)} strokeWidth="0.5" />

            {/* Tick marks */}
            {hourMarkers.map((m, i) => (
              <line
                key={i}
                x1={m.x1} y1={m.y1}
                x2={m.x2} y2={m.y2}
                stroke={
                  m.isQuarter
                    ? primaryRgba(0.9)
                    : m.isHour
                    ? "rgba(148,163,184,0.7)"
                    : "rgba(71,85,105,0.5)"
                }
                strokeWidth={m.isQuarter ? 2.5 : m.isHour ? 1.5 : 0.8}
                strokeLinecap="round"
              />
            ))}

            {/* Hour numbers at 12, 3, 6, 9 */}
            {[0, 3, 6, 9].map((i) => {
              const deg = i * 30;
              const rad = toRad(deg);
              const dist = r - 26;
              return (
                <text
                  key={i}
                  x={cx + dist * Math.cos(rad)}
                  y={cy + dist * Math.sin(rad)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={muted}
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {romanNumerals[i]}
                </text>
              );
            })}

            {/* Hour hand */}
            <line
              x1={hourTail.x} y1={hourTail.y}
              x2={hourTip.x} y2={hourTip.y}
              stroke="url(#hourGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#softGlow)"
            />

            {/* Minute hand */}
            <line
              x1={minuteTail.x} y1={minuteTail.y}
              x2={minuteTip.x} y2={minuteTip.y}
              stroke="url(#minuteGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#softGlow)"
            />

            {/* Second hand */}
            <line
              x1={secondTail.x} y1={secondTail.y}
              x2={secondTip.x} y2={secondTip.y}
              stroke="#f97316"
              strokeWidth="1.5"
              strokeLinecap="round"
              filter="url(#neonGlow)"
            />

            {/* Center decorative circles */}
            <circle cx={cx} cy={cy} r="8" fill="url(#centerGlow)" filter="url(#neonGlow)" />
            <circle cx={cx} cy={cy} r="5" fill={primary} />
            <circle cx={cx} cy={cy} r="2.5" fill="white" opacity="0.9" />
          </svg>
        </div>

        {/* Digital time */}
        <div className="text-center space-y-1 w-full">
          <div className="flex items-baseline justify-center gap-2">
            <span
              className="font-mono font-bold tracking-widest"
              style={{
                fontSize: "2.4rem",
                color: "#e2e8f0",
                textShadow: `0 0 20px ${primaryRgba(0.5)}, 0 0 40px ${primaryRgba(0.2)}`,
                fontVariantNumeric: "tabular-nums",
              }}
              data-testid="text-clock-time"
            >
              {timeStr}
            </span>
            <span
              className="font-mono font-bold text-sm tracking-widest"
              style={{ color: primary, textShadow: `0 0 10px ${primaryRgba(0.8)}` }}
            >
              {period}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${primaryRgba(0.3)})` }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: muted }} data-testid="text-clock-date">
              {dayName}, {dateStr}
            </span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${primaryRgba(0.3)})` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
