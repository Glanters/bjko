import { useState, useEffect } from "react";

export function AnimatedClock() {
  const [time, setTime] = useState(new Date());

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
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const dayName = dayNames[time.getDay()];
  const dateStr = `${dayName}, ${time.getDate()} ${monthNames[time.getMonth()]} ${time.getFullYear()}`;
  const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const cx = 60;
  const cy = 60;
  const r = 54;

  const hourMarkers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const isMain = i % 3 === 0;
    const outer = r;
    const inner = isMain ? r - 10 : r - 6;
    return {
      x1: cx + inner * Math.cos(angle),
      y1: cy + inner * Math.sin(angle),
      x2: cx + outer * Math.cos(angle),
      y2: cy + outer * Math.sin(angle),
      isMain,
    };
  });

  const handCoords = (deg: number, length: number) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return {
      x: cx + length * Math.cos(rad),
      y: cy + length * Math.sin(rad),
    };
  };

  const hourTip = handCoords(hourDeg, 32);
  const minuteTip = handCoords(minuteDeg, 42);
  const secondTip = handCoords(secondDeg, 46);
  const secondTail = handCoords(secondDeg + 180, 12);

  return (
    <div
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-sm p-5 flex flex-col items-center gap-3"
      data-testid="widget-clock"
    >
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="clockFace" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke="rgba(59,130,246,0.25)" strokeWidth="0.5" />
          <circle cx={cx} cy={cy} r={r} fill="url(#clockFace)" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />

          {hourMarkers.map((m, i) => (
            <line
              key={i}
              x1={m.x1} y1={m.y1}
              x2={m.x2} y2={m.y2}
              stroke={m.isMain ? "rgba(148,163,184,0.8)" : "rgba(148,163,184,0.4)"}
              strokeWidth={m.isMain ? 2 : 1}
              strokeLinecap="round"
            />
          ))}

          <line
            x1={cx} y1={cy}
            x2={hourTip.x} y2={hourTip.y}
            stroke="rgba(226,232,240,0.95)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          <line
            x1={cx} y1={cy}
            x2={minuteTip.x} y2={minuteTip.y}
            stroke="rgba(148,163,184,0.95)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          <line
            x1={secondTail.x} y1={secondTail.y}
            x2={secondTip.x} y2={secondTip.y}
            stroke="rgba(59,130,246,1)"
            strokeWidth="1.5"
            strokeLinecap="round"
            filter="url(#glow)"
            style={{ transition: seconds === 0 ? "none" : "transform 0.05s linear" }}
          />

          <circle cx={cx} cy={cy} r="4" fill="rgba(59,130,246,1)" />
          <circle cx={cx} cy={cy} r="2" fill="white" />
        </svg>
      </div>

      <div className="text-center space-y-0.5">
        <div
          className="text-2xl font-mono font-bold tracking-widest text-slate-100"
          data-testid="text-clock-time"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {timeStr}
        </div>
        <div className="text-xs text-slate-400" data-testid="text-clock-date">
          {dateStr}
        </div>
      </div>
    </div>
  );
}
