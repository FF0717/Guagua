import type { FishMood } from "../types/day";

interface Props {
  mood?: FishMood;
  size?: number;
  className?: string;
  onClick?: () => void;
  label?: string;
}

export function Fish({ mood = "idle", size = 64, className = "", onClick, label }: Props) {
  const anim =
    mood === "happy" || mood === "study"
      ? "fish-happy"
      : mood === "sleep"
        ? ""
        : "fish-swim";

  const inner = (
    <span className={`relative block ${anim}`} style={{ width: size * 0.92, height: size * 0.72 }}>
      <svg viewBox="0 0 120 90" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="58" cy="48" rx="42" ry="28" fill="#F8C860" />
        <path d="M20 48 C8 30, 2 22, 10 48 C2 68, 8 66, 20 48Z" fill="#E8B24E" />
        <ellipse cx="72" cy="36" rx="10" ry="7" fill="#F7D78A" opacity="0.9" />
        <circle cx="78" cy="42" r="5.5" fill="#3d3429" />
        <circle cx="80" cy="40.5" r="1.8" fill="#fff" />
        <path d="M90 50 Q98 48 96 56" stroke="#C9843D" strokeWidth="3" fill="none" strokeLinecap="round" />
        {mood === "study" && (
          <g>
            <circle cx="78" cy="42" r="9" fill="none" stroke="#3d3429" strokeWidth="2.2" />
            <line x1="69" y1="42" x2="62" y2="42" stroke="#3d3429" strokeWidth="2" />
          </g>
        )}
        {mood === "sleep" && (
          <path d="M72 42 Q78 46 84 42" stroke="#3d3429" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        )}
        {mood === "miss" && (
          <ellipse cx="58" cy="58" rx="10" ry="4" fill="#E8B24E" opacity="0.55" />
        )}
      </svg>

      {(mood === "happy" || mood === "study") && (
        <>
          <span className="fish-bubble absolute left-[18%] top-0 h-2 w-2 rounded-full bg-white/80" />
          <span
            className="fish-bubble absolute left-[30%] top-1 h-1.5 w-1.5 rounded-full bg-white/70"
            style={{ animationDelay: "0.25s" }}
          />
        </>
      )}
      {mood === "sleep" && (
        <span className="fish-zzz absolute -right-1 -top-2 text-[11px] font-semibold text-[#C9843D]">
          Zzz
        </span>
      )}
    </span>
  );

  const boxStyle = { width: size, height: size };
  const boxClass = `relative inline-flex items-center justify-center ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        aria-label={label || "摸摸鱼"}
        onClick={onClick}
        className={`${boxClass} border-0 bg-transparent p-0 cursor-pointer`}
        style={boxStyle}
      >
        {inner}
      </button>
    );
  }

  return (
    <span className={boxClass} style={boxStyle} aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
      {inner}
    </span>
  );
}
