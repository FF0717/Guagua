import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../store/AppContext";
import { ensureInspireImage, getInspireVisual, preloadAllInspireImages, isInspireThemeId, INSPIRE_THEME_RANDOM, type InspireThemeId } from "../lib/inspire";
import { dayStats, formatMoney, greetByHour } from "../lib/storage";
import { FishHero } from "../components/FishHero";
import { Card } from "../components/ui";
import { ThemePickerModal } from "../components/ThemePickerModal";
import {
  IconBook,
  IconCheck,
  IconChevron,
  IconClock,
  IconPen,
  IconRefresh,
  IconWallet,
} from "../components/Icons";

/** 右侧插画槽：55%。按高度缩放；够宽左对齐裁右边，不够宽右对齐。
 *  换图时先藏新图，onload 后再换底色+图，避免新底色配旧图闪一帧。 */
function InspireArtSlot({
  src,
  slotPct = 55,
  bg,
}: {
  src: string;
  slotPct?: number;
  bg: string;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [pinRight, setPinRight] = useState(false);
  const [painted, setPainted] = useState({ src, bg });

  useEffect(() => {
    if (src === painted.src) {
      if (bg !== painted.bg) setPainted({ src, bg });
      return;
    }
    let cancelled = false;
    const probe = new Image();
    const commit = () => {
      if (!cancelled) setPainted({ src, bg });
    };
    const finish = () => {
      if (typeof probe.decode === "function") {
        probe.decode().then(commit).catch(commit);
      } else {
        commit();
      }
    };
    probe.onerror = commit;
    probe.onload = finish;
    probe.src = src;
    if (probe.complete && probe.naturalWidth > 0) finish();
    return () => {
      cancelled = true;
    };
  }, [src, bg, painted.src, painted.bg]);

  useEffect(() => {
    const slot = slotRef.current;
    const img = imgRef.current;
    if (!slot || !img) return;

    const sync = () => {
      if (!img.naturalWidth || !img.naturalHeight || !slot.clientHeight) return;
      const scaledW = (img.naturalWidth / img.naturalHeight) * slot.clientHeight;
      setPinRight(scaledW < slot.clientWidth - 0.5);
    };

    sync();
    img.addEventListener("load", sync);
    const ro = new ResizeObserver(sync);
    ro.observe(slot);
    return () => {
      img.removeEventListener("load", sync);
      ro.disconnect();
    };
  }, [painted.src]);

  return (
    <div
      ref={slotRef}
      className="pointer-events-none absolute inset-y-0 right-0 overflow-hidden rounded-tr-[22px] rounded-br-[22px]"
      style={{
        width: `calc(${slotPct}% + 3px)`,
        backgroundColor: painted.bg,
        boxShadow: `-4px 0 0 ${painted.bg}`,
      }}
    >
      <img
        ref={imgRef}
        src={painted.src}
        alt=""
        className={`absolute top-0 h-full w-auto max-w-none ${pinRight ? "right-0" : "left-0"}`}
        style={pinRight ? undefined : { left: -2 }}
        draggable={false}
      />
    </div>
  );
}

export function HomePage() {
  const { data, today, shuffleInspire, setInspireTheme, openHarvest, openPage, openJournalNote, toggleTodo } = useApp();
  const stats = dayStats(today);
  const homeReminders = today.todos.filter((t) => !t.done && t.text.trim());
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
  const completeTimers = useRef<Map<string, number>>(new Map());
  const [inspireBusy, setInspireBusy] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  const inspireTheme: InspireThemeId = isInspireThemeId(data.settings.inspireTheme)
    ? data.settings.inspireTheme
    : INSPIRE_THEME_RANDOM;

  useEffect(() => {
    void preloadAllInspireImages();
  }, []);

  useEffect(() => {
    const timers = completeTimers.current;
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };
  }, []);

  // 已真正完成的项从本地「完成中」状态清掉
  useEffect(() => {
    setCompletingIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      prev.forEach((id) => {
        if (!homeReminders.some((t) => t.id === id)) {
          next.delete(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [homeReminders]);

  const markHomeComplete = (id: string) => {
    if (completingIds.has(id)) {
      const timer = completeTimers.current.get(id);
      if (timer) window.clearTimeout(timer);
      completeTimers.current.delete(id);
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }
    setCompletingIds((prev) => new Set(prev).add(id));
    const timer = window.setTimeout(() => {
      completeTimers.current.delete(id);
      toggleTodo(id);
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 3000);
    completeTimers.current.set(id, timer);
  };

  const greetingWord = greetByHour();
  const greeting = useMemo(() => {
    const name = (data.settings.displayName || "").trim();
    return name ? `${greetingWord}，${name}` : greetingWord;
  }, [data.settings.displayName, greetingWord]);

  const homeFishSrc =
    greetingWord === "夜深了"
      ? "/icons/home-fish-late.png?v=2"
      : "/icons/home-fish.png";

  const inspireTarget = useMemo(
    () => getInspireVisual(data.inspireCategory),
    [data.inspireCategory]
  );
  const [inspireShown, setInspireShown] = useState(() => ({
    text: data.inspireCategory,
    ...getInspireVisual(data.inspireCategory),
  }));

  // 文案/底色/插画只在新图可绘制后一起上屏，避免「新底色 + 旧图」闪一下
  useEffect(() => {
    const next = {
      text: data.inspireCategory,
      ...inspireTarget,
    };
    if (
      next.text === inspireShown.text &&
      next.src === inspireShown.src &&
      next.bg === inspireShown.bg
    ) {
      return;
    }
    let cancelled = false;
    void ensureInspireImage(next.src).then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (!cancelled) setInspireShown(next);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    data.inspireCategory,
    inspireTarget,
    inspireShown.text,
    inspireShown.src,
    inspireShown.bg,
  ]);

  const inspirePending =
    inspireShown.text !== data.inspireCategory ||
    inspireShown.src !== inspireTarget.src;

  return (
    <div
      className="mx-auto max-w-[430px] px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 18px)" }}
    >
      {/* 问候语 + 右侧小鱼：略往中间收，但留开间距 */}
      <header className="fish-home-hero mb-5 flex min-h-[120px] w-full max-w-full items-center justify-between gap-4 overflow-visible px-5 pt-2 pb-1">
        <div className="min-w-0 flex-1 py-1">
          <h1 className="fish-home-greet max-w-full truncate text-[26px] font-semibold leading-[1.25] tracking-[0.02em] text-ink">
            {greeting}
          </h1>
        </div>
        <FishHero className="shrink-0" src={homeFishSrc} />
      </header>

      {/* 今天的小收获 */}
      <Card className="mb-5 overflow-hidden px-0 py-0">
        <button
          type="button"
          className="flex h-[46px] w-full items-center justify-between border-0 border-b border-line bg-transparent px-5 text-left"
          onClick={() => openHarvest("all")}
        >
          <span className="text-[16px] font-semibold text-ink">今天的小收获</span>
          <IconChevron size={16} className="text-[#C8C4BC]" />
        </button>
        <div className="grid grid-cols-3 items-center px-1 py-4">
          <HarvestCol
            value={String(stats.know)}
            label="今日知识"
            tone="know"
            icon={<IconBook size={12} />}
            onClick={() => openHarvest("knowledge")}
          />
          <HarvestCol
            value={String(stats.lifeTotal)}
            label="今日生活"
            tone="life"
            icon={<IconClock size={12} />}
            divider
            onClick={() => openHarvest("life")}
          />
          <HarvestCol
            value={formatMoney(stats.spendTotal).replace(/^¥/, "")}
            label="今日花费"
            tone="spend"
            icon={<IconWallet size={12} />}
            divider
            onClick={() => openHarvest("spend")}
          />
        </div>
      </Card>

      {/* 快捷入口 */}
      <section className="mb-5">
        <div className="grid grid-cols-2 gap-3">
          <QuickTile
            tone="know"
            icon={<IconBook size={26} />}
            title="学一学"
            sub="摘录新的发现"
            onClick={() => openPage("discovery")}
          />
          <QuickTile
            tone="life"
            icon={<IconClock size={26} />}
            title="记时间"
            sub="定格今日时光"
            onClick={() => openPage("life")}
          />
          <QuickTile
            tone="spend"
            icon={<IconWallet size={26} />}
            title="记花费"
            sub="记下一笔花费"
            onClick={() => openPage("spend")}
          />
          <QuickTile
            tone="note"
            icon={<IconPen size={26} />}
            title="写日志"
            sub="记录每日生活"
            onClick={() => openJournalNote()}
          />
        </div>
      </section>

      {/* 今日计划 */}
      <section className="mb-5 rounded-[22px] bg-white px-5 pb-5 pt-5 card-shadow">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-sans text-[18px] font-semibold leading-none tracking-tight text-ink">
            今日计划
          </h2>
          <button
            type="button"
            onClick={() => openPage("reminders")}
            className="inline-flex items-center gap-0.5 border-0 bg-transparent p-0 font-sans text-[13px] font-normal leading-none text-muted"
          >
            全部计划
            <IconChevron size={13} className="text-[#C8C4BC]" />
          </button>
        </div>

        {homeReminders.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {homeReminders.map((t) => {
              const completing = completingIds.has(t.id);
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => markHomeComplete(t.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-0 ${
                      completing ? "bg-fish" : "bg-transparent"
                    }`}
                    style={completing ? undefined : { boxShadow: "inset 0 0 0 1.5px #cfcbc4" }}
                    aria-label={completing ? "取消完成" : "完成"}
                  >
                    {completing ? <IconCheck size={12} stroke="#fff" /> : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => openPage("reminders")}
                    className={`min-w-0 flex-1 border-0 bg-transparent py-0 text-left font-sans text-[15px] font-normal leading-[1.55] ${
                      completing
                        ? "text-muted line-through decoration-ink/25"
                        : "text-ink"
                    }`}
                  >
                    {t.text}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => openPage("reminders")}
            className="w-full border-0 bg-transparent py-0 text-left font-sans text-[15px] font-normal leading-[1.55] text-muted"
          >
            还没有计划，去加一条吧
          </button>
        )}
      </section>

      {/* 今日灵感 */}
      <section className="mb-2">
        <div className="flex justify-end pr-5 pt-2 pb-3.5">
          <button
            type="button"
            onClick={() => setThemePickerOpen(true)}
            className="inline-flex items-center gap-0.5 border-0 bg-transparent p-0 font-sans text-[13px] font-normal leading-none text-muted"
          >
            选择主题
            <IconChevron size={13} className="text-[#C8C4BC]" />
          </button>
        </div>
        <div
          className="relative overflow-hidden rounded-[22px]"
          style={{ backgroundColor: inspireShown.bg }}
        >
          <InspireArtSlot
            src={inspireShown.src}
            slotPct={inspireShown.slotPct}
            bg={inspireShown.bg}
          />
          <button
            type="button"
            disabled={inspireBusy || inspirePending}
            onClick={(e) => {
              e.stopPropagation();
              if (inspireBusy || inspirePending) return;
              setInspireBusy(true);
              void shuffleInspire().finally(() => setInspireBusy(false));
            }}
            className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border-0 bg-white/45 text-[#8A9AA6] backdrop-blur-[2px] disabled:opacity-70"
            aria-label="换一个灵感"
          >
            <IconRefresh
              size={18}
              className={inspireBusy || inspirePending ? "animate-spin" : undefined}
            />
          </button>

          <div
            className="relative z-[1] flex min-h-[112px] items-center pl-5 pt-4 pb-3"
            style={{ paddingRight: `${inspireShown.slotPct}%` }}
          >
            <div className="min-w-0 flex-1 -translate-y-1.5 py-1">
              <h2 className="font-sans text-[18px] font-semibold leading-none tracking-tight text-ink">
                今日灵感
              </h2>
              <p className="mt-4 whitespace-nowrap font-sans text-[15px] font-normal leading-[1.55] text-muted">
                {inspireShown.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ThemePickerModal
        open={themePickerOpen}
        value={inspireTheme}
        onCancel={() => setThemePickerOpen(false)}
        onConfirm={(theme) => {
          setThemePickerOpen(false);
          void setInspireTheme(theme);
        }}
      />
    </div>
  );
}

function HarvestCol({
  value,
  label,
  tone,
  icon,
  divider,
  onClick,
}: {
  value: string;
  label: string;
  tone: "know" | "life" | "spend";
  icon: ReactNode;
  divider?: boolean;
  onClick?: () => void;
}) {
  const badge =
    tone === "know"
      ? "bg-know text-know-ink"
      : tone === "life"
        ? "bg-life text-life-ink"
        : "bg-spend text-spend-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2.5 border-0 bg-transparent px-1 py-1 ${
        divider ? "border-l border-line" : ""
      }`}
    >
      <strong className="font-rounded text-[34px] font-bold leading-none tracking-tight text-ink">
        {value}
      </strong>
      <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${badge.split(" ")[1]}`}>
        <span className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-md ${badge.split(" ")[0]}`}>
          {icon}
        </span>
        {label}
      </span>
    </button>
  );
}

function QuickTile({
  tone,
  icon,
  title,
  sub,
  onClick,
}: {
  tone: "know" | "life" | "spend" | "note";
  icon: ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  // 底色不变，只叠同色相略深的对角渐变（不往白里漂、不发灰）
  const bg =
    tone === "know"
      ? "linear-gradient(to top right, #e8dff8 0%, #f3eefc 55%, #f3eefc 100%)"
      : tone === "life"
        ? "linear-gradient(to top right, #dff1e6 0%, #eef8f1 55%, #eef8f1 100%)"
        : tone === "spend"
          ? "linear-gradient(to top right, #f5e4bc 0%, #fcf2d8 55%, #fcf2d8 100%)"
          : "linear-gradient(to top right, #f2d9d7 0%, #f9e9e8 55%, #f9e9e8 100%)";
  const ink =
    tone === "know"
      ? "text-know-ink"
      : tone === "life"
        ? "text-life-ink"
        : tone === "spend"
          ? "text-spend-ink"
          : "text-note-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[88px] items-center gap-3 rounded-[22px] border-0 px-3.5 py-3 text-left"
      style={{ backgroundImage: bg }}
    >
      <span
        className={`inline-flex size-14 shrink-0 items-center justify-center rounded-[16px] bg-white ${ink}`}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <strong className="block truncate text-[15px] font-semibold leading-none text-ink">
          {title}
        </strong>
        <span className="block truncate text-[12px] leading-none text-muted">{sub}</span>
      </span>
    </button>
  );
}
