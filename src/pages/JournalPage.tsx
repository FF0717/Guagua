import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../store/AppContext";
import { formatCN, todayKey } from "../lib/storage";
import { dayMatchesDateQuery, parseDateQuery } from "../lib/dateQuery";
import type { Day } from "../types/day";
import {
  IconBack,
  IconBook,
  IconClose,
  IconFilter,
  IconSearch,
  IconStar,
} from "../components/Icons";
import { LongPressable } from "../components/LongPressable";
import { DeleteDayConfirm } from "../components/DeleteDayConfirm";
import { Card } from "../components/ui";
import { useSwipeBack } from "../hooks/useSwipeBack";

const DECOR: { bg: string; emoji: string }[] = [
  { bg: "#efe6fb", emoji: "📖" },
  { bg: "#fce8d8", emoji: "🍲" },
  { bg: "#e4eef8", emoji: "🌧" },
  { bg: "#e8f3e9", emoji: "🌿" },
  { bg: "#f9e9e8", emoji: "✏️" },
  { bg: "#fcf2d8", emoji: "☀️" },
];

type SortFilter = "newest" | "oldest" | "starred";

const FILTER_OPTS: { id: SortFilter; label: string }[] = [
  { id: "newest", label: "最新" },
  { id: "oldest", label: "最早" },
  { id: "starred", label: "收藏" },
];

function decorFor(date: string) {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h + date.charCodeAt(i) * (i + 1)) % DECOR.length;
  return DECOR[h];
}

function entryTitle(day: Day) {
  const note = day.shortNote.trim();
  if (note) return note;
  const first = day.journal.trim().split("\n")[0]?.trim();
  if (first) return first;
  if (day.highlightText.trim()) return day.highlightText.trim();
  return day.date === todayKey() ? "今天" : formatCN(day.date);
}

function entryBody(day: Day) {
  const note = day.shortNote.trim();
  const journal = day.journal.trim();
  if (note && journal) return journal;
  if (journal.includes("\n")) return journal.split("\n").slice(1).join("\n").trim();
  return "";
}

function dayHasJournal(day: Day) {
  return !!(day.shortNote.trim() || day.journal.trim());
}

function dayMatchesQuery(day: Day, q: string) {
  if (!q) return true;

  const parsed = parseDateQuery(q);
  if (parsed && dayMatchesDateQuery(day.date, parsed)) return true;

  const hay = [
    day.date,
    formatCN(day.date),
    `${Number(day.date.slice(5, 7))}.${Number(day.date.slice(8, 10))}`,
    `${Number(day.date.slice(5, 7))}/${Number(day.date.slice(8, 10))}`,
    `${Number(day.date.slice(5, 7))}-${Number(day.date.slice(8, 10))}`,
    day.shortNote,
    day.journal,
    day.highlightText,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export function JournalPage({ open }: { open: boolean }) {
  const { data, closePage, openDay, deleteDay, reviewMonth, calendarDay } = useApp();
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SortFilter>("newest");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { panelRef, dragging, settling, dismissed } = useSwipeBack(closePage, open && entered);

  const { year, month } = reviewMonth;
  const isYearView = month === -1;
  const { y: nowY, m: nowM } = (() => {
    const [y, m] = calendarDay.split("-").map(Number);
    return { y, m: m - 1 };
  })();
  const maxMonthInYear = year === nowY ? nowM : 11;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setEntered(false);
      let id2 = 0;
      const id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        cancelAnimationFrame(id1);
        cancelAnimationFrame(id2);
      };
    }
    setEntered(false);
    setQuery("");
    setFilter("newest");
    setMenuOpen(false);
    setPendingDelete(null);
    const t = window.setTimeout(() => setMounted(false), dismissed ? 40 : 500);
    return () => window.clearTimeout(t);
  }, [open, dismissed]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [menuOpen]);

  const entries = useMemo(() => {
    const q = query.trim();
    let rows = Object.values(data.days).filter((d) => {
      if (!dayHasJournal(d)) return false;
      const [y, m] = d.date.split("-").map(Number);
      if (y !== year) return false;
      if (isYearView) {
        if (m < 1 || m > maxMonthInYear + 1) return false;
      } else if (m !== month + 1) {
        return false;
      }
      return dayMatchesQuery(d, q);
    });
    if (filter === "starred") {
      rows = rows.filter((d) => d.highlight);
    }
    rows.sort((a, b) =>
      filter === "oldest" ? (a.date < b.date ? -1 : 1) : a.date < b.date ? 1 : -1
    );
    return rows;
  }, [data.days, query, filter, year, month, isYearView, maxMonthInYear]);

  const emptyPeriodHint = isYearView ? "这一年还没有日志" : "这个月还没有日志";

  if (!mounted) return null;

  const qTrim = query.trim();
  const emptySearch = qTrim.length > 0 && entries.length === 0;
  const emptyStarred = filter === "starred" && !qTrim && entries.length === 0;

  return (
    <div
      ref={panelRef}
      className={`page-push ${entered && !dismissed ? "page-push-in" : ""} ${
        dragging ? "page-push-dragging" : ""
      } ${settling ? "page-push-settling" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="我的日志"
    >
      <div className="relative flex h-full flex-col bg-cream">
        <header className="px-5 safe-header-pt">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closePage}
              className="-ml-2.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-ink"
              aria-label="返回"
            >
              <IconBack size={22} />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-[18px] font-bold leading-none text-ink">我的日志</h1>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-ink"
                aria-label="筛选"
                aria-expanded={menuOpen}
              >
                <IconFilter size={20} />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-11 z-30 min-w-[132px] overflow-hidden rounded-[14px] bg-white py-1.5 shadow-[0_10px_28px_rgba(60,50,30,0.14)]">
                  {FILTER_OPTS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFilter(opt.id);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full border-0 bg-transparent px-4 py-2.5 text-left text-[14px] ${
                        filter === opt.id ? "font-semibold text-ink" : "font-medium text-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(24px,calc(env(safe-area-inset-bottom,0px)+16px))] pt-3">
          <label className="mb-4 flex h-10 items-center gap-2 rounded-full bg-white px-3.5 shadow-[0_2px_10px_rgba(60,50,30,0.015)]">
            <IconSearch size={16} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder=""
              aria-label="搜索日期或内容"
              className="w-full border-0 bg-transparent text-[15px] outline-none"
            />
            {qTrim ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-0 bg-[#E8E4DE] text-muted"
                aria-label="清空"
              >
                <IconClose size={12} />
              </button>
            ) : null}
          </label>

          {entries.length ? (
            <ol className="relative m-0 list-none p-0">
              <span
                className="pointer-events-none absolute bottom-3 left-[7px] top-3 w-px bg-[#e6e1d8]"
                aria-hidden
              />
              {entries.map((day) => {
                const decor = decorFor(day.date);
                const title = entryTitle(day);
                const body = entryBody(day);
                return (
                  <li key={day.date} className="relative mb-5 pl-7 last:mb-0">
                    <span
                      className="absolute left-0 top-[7px] h-[15px] w-[15px] rounded-full border-[3px] border-[#e6e1d8] bg-cream"
                      aria-hidden
                    />
                    <div className="mb-2 flex items-center gap-1.5 px-0.5">
                      <time className="text-[13px] font-medium leading-none text-muted">
                        {formatCN(day.date)}
                      </time>
                      {day.highlight ? (
                        <IconStar
                          size={11}
                          className="block translate-y-[1px] text-[#E8B24E]"
                          stroke="#E8B24E"
                        />
                      ) : null}
                    </div>
                    <LongPressable
                      onClick={() => openDay(day.date, "journal")}
                      onLongPress={() => setPendingDelete(day.date)}
                      className="flex min-h-[108px] w-full items-center gap-3 rounded-[18px] border border-[#ebe4da] bg-white px-4 py-4 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-[15px] font-semibold leading-snug text-ink">
                          {title}
                        </strong>
                        {body ? (
                          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-muted">
                            {body}
                          </p>
                        ) : null}
                      </span>
                      <span
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[22px]"
                        style={{ backgroundColor: decor.bg }}
                        aria-hidden
                      >
                        {decor.emoji}
                      </span>
                    </LongPressable>
                  </li>
                );
              })}
            </ol>
          ) : emptySearch ? (
            <Card className="px-5 py-10 text-center">
              <img
                src="/icons/fish-sad.png?v=6"
                alt=""
                width={72}
                height={72}
                className="mx-auto mb-3 h-[72px] w-[72px] object-contain"
                draggable={false}
              />
              <strong className="block text-[16px] font-semibold text-ink">没有找到相关内容</strong>
              <p className="mt-2 text-[13px] text-muted">试试换个关键词或日期</p>
            </Card>
          ) : emptyStarred ? (
            <p className="pt-10 text-center text-[14px] text-muted">还没有收藏的日志</p>
          ) : (
            <div className="px-2 py-16 text-center">
              <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-note text-note-ink">
                <IconBook size={28} />
              </span>
              <strong className="block text-[16px] font-semibold text-ink">{emptyPeriodHint}</strong>
              <p className="mt-2 text-[13px] text-muted">回去写一句，留下这一天吧</p>
            </div>
          )}
        </div>

        <DeleteDayConfirm
          date={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onConfirm={deleteDay}
        />
      </div>
    </div>
  );
}
