import { useEffect, useId, useRef, useState } from "react";
import type { TabId } from "../types/day";
import { useApp } from "../store/AppContext";
import { IconCalendar, IconHeart, IconHome, IconUser } from "./Icons";

const LEFT: { id: TabId; label: string; Icon: typeof IconHome }[] = [
  { id: "home", label: "今天", Icon: IconHome },
  { id: "favorites", label: "知识", Icon: IconHeart },
];
const RIGHT: { id: TabId; label: string; Icon: typeof IconHome }[] = [
  { id: "review", label: "回顾", Icon: IconCalendar },
  { id: "mine", label: "我的", Icon: IconUser },
];

const WAG_EVERY_MS = 5 * 60 * 1000;
const WAG_DURATION_MS = 1800;

/** 底栏 + 中间圆凸起的外轮廓（与 116×108、-mt-10 对齐） */
function tabSilhouettePath(width: number) {
  const w = Math.max(width, 1);
  const barTop = 40;
  const h = 120;
  const cx = w / 2;
  const rx = 58;
  const ry = 54;
  const cy = 54;
  const dy = barTop - cy;
  const dx = rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)));
  const x1 = cx - dx;
  const x2 = cx + dx;
  return `M0,${h} L0,${barTop} L${x1},${barTop} A${rx},${ry} 0 0 1 ${x2},${barTop} L${w},${barTop} L${w},${h} Z`;
}

export function TabBar() {
  const { tab, setTab, pokeTabFish } = useApp();
  const [wagging, setWagging] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const stopTimerRef = useRef(0);
  const [barW, setBarW] = useState(390);
  const shadowId = useId().replace(/:/g, "");

  const triggerWag = () => {
    window.clearTimeout(stopTimerRef.current);
    // 连点时先关掉再开，才能重播 CSS 动画
    setWagging(false);
    requestAnimationFrame(() => {
      setWagging(true);
      stopTimerRef.current = window.setTimeout(() => setWagging(false), WAG_DURATION_MS);
    });
  };

  useEffect(() => {
    const tick = () => triggerWag();
    // 刷新 / 第一次进入时先晃一下
    const startTimer = window.setTimeout(tick, 120);
    const interval = window.setInterval(tick, WAG_EVERY_MS);
    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(interval);
      window.clearTimeout(stopTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const sync = () => setBarW(el.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <nav className="app-tabbar" aria-label="主导航">
      <div
        ref={shellRef}
        className="relative"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* 一整块白底外轮廓 + 一层暖阴影，交界处不会拼缝重影 */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-10 h-[120px] w-full overflow-visible"
          viewBox={`0 0 ${barW} 120`}
        >
          <defs>
            <filter
              id={`tabbar-shadow-${shadowId}`}
              x="-10%"
              y="-55%"
              width="120%"
              height="220%"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow
                dx="0"
                dy="-1.5"
                stdDeviation="5"
                floodColor="#8a6230"
                floodOpacity="0.14"
              />
            </filter>
          </defs>
          <path
            d={tabSilhouettePath(barW)}
            fill="#ffffff"
            filter={`url(#tabbar-shadow-${shadowId})`}
          />
        </svg>

        {/* 底部安全区续白 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-white"
          style={{ height: "env(safe-area-inset-bottom, 0px)" }}
        />

        <div className="relative mx-auto grid h-20 grid-cols-5 items-end px-1 pb-2">
          {LEFT.map((t) => (
            <TabBtn
              key={t.id}
              active={tab === t.id}
              label={t.label}
              Icon={t.Icon}
              onClick={() => setTab(t.id)}
            />
          ))}
          <div aria-hidden className="h-12" />
          {RIGHT.map((t) => (
            <TabBtn
              key={t.id}
              active={tab === t.id}
              label={t.label}
              Icon={t.Icon}
              onClick={() => setTab(t.id)}
            />
          ))}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <button
              type="button"
              className="pointer-events-auto -mt-10 flex h-[108px] w-[116px] items-center justify-center rounded-full border-0 bg-transparent p-0 shadow-none"
              aria-label="摸摸鱼"
              onClick={() => {
                triggerWag();
                pokeTabFish();
              }}
            >
              <img
                src="/icons/tab-fish.png?v=2"
                alt=""
                width={72}
                height={72}
                className={`tab-fish-wag block h-[72px] w-[72px] object-contain select-none ${
                  wagging ? "tab-fish-wag-on" : ""
                }`}
                draggable={false}
              />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function TabBtn({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  Icon: typeof IconHome;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 border-0 bg-transparent pb-1 text-[11px] font-medium ${
        active ? "text-fish-deep" : "text-muted"
      }`}
    >
      <Icon size={22} stroke={active ? "#E8B24E" : "#9A9690"} />
      {label}
    </button>
  );
}
