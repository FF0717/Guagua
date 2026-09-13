/** Line icons only — no emoji */

type IconProps = { size?: number; className?: string; stroke?: string };

const defaults = (p: IconProps) => ({
  width: p.size ?? 22,
  height: p.size ?? 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: p.stroke ?? "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: p.className,
  "aria-hidden": true as const,
});

export function IconBook(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M4.5 5A2 2 0 0 1 6.5 3H20v17H6.5A2 2 0 0 1 4.5 18V5Z" />
      <path d="M4.5 18A2 2 0 0 1 6.5 16H20" />
    </svg>
  );
}

export function IconClock(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

export function IconWallet(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <rect x="3.5" y="6" width="17" height="12.5" rx="2.5" />
      <path d="M3.5 10H20.5" />
      <circle cx="16.5" cy="14.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPen(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      {/* 斜放笔：尖在左下、尾在右上，落在 24 框正中 */}
      <path d="M4.8 15.5 15.5 4.8l3.7 3.7L8.5 19.2H4.8v-3.7Z" />
    </svg>
  );
}

export function IconHome(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.5 10.5V20h11V10.5" />
    </svg>
  );
}

export function IconHeart(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />
    </svg>
  );
}

export function IconCalendar(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" />
    </svg>
  );
}

export function IconUser(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <circle cx="12" cy="9" r="3.2" />
      <path d="M5.5 19.5c1.4-2.6 3.4-3.9 6.5-3.9s5.1 1.3 6.5 3.9" />
    </svg>
  );
}

export function IconBell(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M7 10a5 5 0 0 1 10 0c0 4 1.5 5.2 1.5 5.2H5.5S7 14 7 10Z" />
      <path d="M10.2 18.5a1.8 1.8 0 0 0 3.6 0" />
    </svg>
  );
}

export function IconSearch(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.2 16.2 20 20" />
    </svg>
  );
}

export function IconFilter(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function IconChevron(p: IconProps = {}) {
  return (
    <svg {...defaults({ ...p, size: p.size ?? 16 })}>
      <path d="M9 5.5 14.5 12 9 18.5" />
    </svg>
  );
}

export function IconBack(p: IconProps = {}) {
  return (
    <svg {...defaults({ ...p, size: p.size ?? 20 })}>
      <path d="M15 5.5 9.5 12 15 18.5" />
    </svg>
  );
}

export function IconClose(p: IconProps = {}) {
  return (
    <svg {...defaults({ ...p, size: p.size ?? 20 })}>
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
    </svg>
  );
}

export function IconImage(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M3.8 16.5 9 12.5l3.2 2.8 3-3.3 5 4.5" />
    </svg>
  );
}

export function IconLink(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M10 13.5a4 4 0 0 0 5.7.4l2.2-2.2a4 4 0 0 0-5.7-5.7L11 7.2" />
      <path d="M14 10.5a4 4 0 0 0-5.7-.4L6.1 12.3a4 4 0 0 0 5.7 5.7L13 16.8" />
    </svg>
  );
}

export function IconQuote(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M7.5 16.5c1.8 0 3.2-1.4 3.2-3.2S9.3 10 7.5 10c0-2.4 1.6-4 4-4v1.6c-1.4.2-2.4 1.2-2.4 2.5 1.5.1 2.6 1.3 2.6 2.8 0 1.6-1.3 2.9-2.9 2.9-.5 0-1-.1-1.3-.3z" />
      <path d="M15.5 16.5c1.8 0 3.2-1.4 3.2-3.2S17.3 10 15.5 10c0-2.4 1.6-4 4-4v1.6c-1.4.2-2.4 1.2-2.4 2.5 1.5.1 2.6 1.3 2.6 2.8 0 1.6-1.3 2.9-2.9 2.9-.5 0-1-.1-1.3-.3z" />
    </svg>
  );
}

export function IconCheck(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M5.5 12.5 10 17l8.5-9" />
    </svg>
  );
}

export function IconStar(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M12 0.5 15.2 8.4l8.3.7-6.3 5.5 2 8.2L12 18.4 4.8 22.8l2-8.2L0.5 9.1l8.3-.7L12 0.5Z" />
    </svg>
  );
}

export function IconStarOutline(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M12 0.5 15.2 8.4l8.3.7-6.3 5.5 2 8.2L12 18.4 4.8 22.8l2-8.2L0.5 9.1l8.3-.7L12 0.5Z" />
    </svg>
  );
}

export function IconPlus(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconHand(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M8.5 11V7.2a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M11.3 10.5V6.3a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M14.1 10.8V7.5a1.4 1.4 0 0 1 2.8 0v6.2c0 3-2 5.3-4.9 5.3H12c-3.2 0-5.5-2-5.5-5.2V12" />
      <path d="M8.5 12.5V9.2A1.3 1.3 0 0 0 6 9.2v4.5" />
    </svg>
  );
}

export function IconList(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M8 7h12M8 12h12M8 17h12" />
      <path d="M4 7h.01M4 12h.01M4 17h.01" />
    </svg>
  );
}

export function IconNet(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <circle cx="10" cy="10" r="5.5" />
      <path d="M14 14 20 20" />
      <path d="M7 8.5h6M8.5 7v6M7.2 12.2l5.2-5.2M7.2 7.8l5.2 5.2" />
    </svg>
  );
}

export function IconDoc(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4.5M9 12h6M9 16h6" />
    </svg>
  );
}

export function IconExport(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M12 15V4.5M8.5 8 12 4.5 15.5 8" />
      <path d="M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" />
    </svg>
  );
}

export function IconImport(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M12 4.5V15M8.5 11.5 12 15l3.5-3.5" />
      <path d="M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" />
    </svg>
  );
}

export function IconTags(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconPalette(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M2.8 12S6.5 6.2 12 6.2 21.2 12 21.2 12 17.5 17.8 12 17.8 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function IconGear(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" />
    </svg>
  );
}

export function IconInfo(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.5V17M12 7.5h.01" />
    </svg>
  );
}

export function IconRefresh(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.1-5.2" />
      <path d="M19.5 5v4.5H15" />
    </svg>
  );
}

export function IconDot(p: IconProps & { fill?: string } = {}) {
  return (
    <svg width={p.size ?? 8} height={p.size ?? 8} viewBox="0 0 8 8" className={p.className} aria-hidden>
      <circle cx="4" cy="4" r="4" fill={p.fill ?? "currentColor"} />
    </svg>
  );
}
