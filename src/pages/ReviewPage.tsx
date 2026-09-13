import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useApp } from "../store/AppContext";
import {
  calendarPads,
  dayHasLeft,
  dayStats,
  formatCN,
  formatMinutes,
  formatMoney,
  monthKeys,
} from "../lib/storage";
import { Card, TextLink } from "../components/ui";
import {
  IconBack,
  IconChevron,
  IconFilter,
  IconStar,
  IconStarOutline,
} from "../components/Icons";
import { ThumbFish } from "../components/ThumbFish";
import { thumbPalette } from "../lib/categoryColor";
import { PagePush } from "../components/PagePush";
import { PageHeader } from "../components/PageHeader";
import { LongPressable } from "../components/LongPressable";
import { DeleteDayConfirm } from "../components/DeleteDayConfirm";
import { MonthPickerModal } from "../components/MonthPickerModal";
import type { Day, ExpenseItem, KnowledgeItem, LifeItem } from "../types/day";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_LIFE_CATALOG,
  EXPENSE_CATEGORIES,
  UNCATEGORIZED,
} from "../types/day";

const MIN_YEAR = 2025;
const FUTURE_TIP = "时间还没到呢";
const PREVIEW_COUNT = 3;
/** 回顾列表条：白底 + 暖色阴影 */
const ROW_BG = "#FFFFFF";
const ROW_SHADOW = "0 2px 8px rgba(200, 165, 90, 0.12)";
/** 总数与条内图标共用左缩进 */
const ALIGN_PAD_L = "pl-2";
const ROW_PAD_X = `${ALIGN_PAD_L} pr-3`;

const JOURNAL_DECOR: { bg: string; emoji: string }[] = [
  { bg: "#efe6fb", emoji: "📖" },
  { bg: "#fce8d8", emoji: "🍲" },
  { bg: "#e4eef8", emoji: "🌧" },
  { bg: "#e8f3e9", emoji: "🌿" },
  { bg: "#f9e9e8", emoji: "✏️" },
  { bg: "#fcf2d8", emoji: "☀️" },
];

function journalDecor(date: string) {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h + date.charCodeAt(i) * (i + 1)) % JOURNAL_DECOR.length;
  return JOURNAL_DECOR[h];
}

type ReviewTab = "发现" | "花费" | "生活";
/** newest / oldest 为排序；其余字符串为分类名 */
type ListFilter = "newest" | "oldest" | string;

const TAB_IDS: ReviewTab[] = ["发现", "花费", "生活"];

const ROW_BADGES = [
  { bg: "#FFF1C2", kind: "star" as const },
  { bg: "#FFE2B8", kind: "sun" as const },
  { bg: "#DCEEFF", kind: "cloud" as const },
  { bg: "#EDE4FF", kind: "book" as const },
  { bg: "#DFF3E4", kind: "leaf" as const },
];

const TAG_PALETTE = [
  { bg: "#FBE8DC", ink: "#B56B4A" },
  { bg: "#E4F2E8", ink: "#4A7357" },
  { bg: "#EDE4FF", ink: "#6B5B8C" },
  { bg: "#FFF1C2", ink: "#9A7040" },
  { bg: "#F9E9E8", ink: "#8C5B5B" },
];

function tagStyle(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h + key.charCodeAt(i) * (i + 1)) % TAG_PALETTE.length;
  return TAG_PALETTE[h]!;
}

function nowParts() {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() };
}

function YearCalendar({
  year,
  today,
  days,
  onOpenDay,
  onSelectMonth,
}: {
  year: number;
  today: string;
  days: Record<string, Day | undefined>;
  onOpenDay: (key: string) => void;
  onSelectMonth: (monthIndex: number) => void;
}) {
  const { y: nowY, m: nowM } = nowParts();

  return (
    <Card className="mb-4 px-2.5 py-4">
      <div className="grid grid-cols-3 gap-x-1 gap-y-5">
        {Array.from({ length: 12 }, (_, monthIndex) => {
          const keysForMonth = monthKeys(year, monthIndex);
          const pad = calendarPads(year, monthIndex);
          const isCurrentMonth = year === nowY && monthIndex === nowM;

          return (
            <div key={monthIndex} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelectMonth(monthIndex)}
                className={`mb-1.5 block w-full border-0 bg-transparent p-0 text-left text-[13px] font-semibold ${
                  isCurrentMonth ? "text-fish-deep" : "text-ink"
                }`}
              >
                {monthIndex + 1}月
              </button>
              <div className="grid grid-cols-7">
                {Array.from({ length: pad }).map((_, i) => (
                  <span key={`p${i}`} className="aspect-square" />
                ))}
                {keysForMonth.map((key) => {
                  const day = days[key];
                  const d = Number(key.slice(-2));
                  const has = dayHasLeft(day);
                  const hl = !!day?.highlight;
                  const isToday = key === today;
                  const isFuture = key > today;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isFuture}
                      onClick={() => onOpenDay(key)}
                      className="flex aspect-square flex-col items-center justify-center border-0 bg-transparent p-0 disabled:opacity-25"
                    >
                      <span
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] leading-none ${
                          isToday ? "bg-fish font-semibold text-ink" : "text-ink"
                        }`}
                      >
                        {d}
                      </span>
                      {hl || has ? (
                        <span className="mt-px block h-0.5 w-2 rounded-full bg-fish-deep" />
                      ) : (
                        <span className="mt-px block h-0.5" aria-hidden />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function ReviewPage() {
  const {
    data,
    reviewMonth,
    setReviewMonth,
    openDay,
    openKnowledge,
    openPage,
    showFishDanmaku,
    deleteDay,
    calendarDay,
  } = useApp();
  const { year, month } = reviewMonth;
  const isYearView = month === -1;
  const { y: nowY, m: nowM } = nowParts();
  const maxYear = nowY;
  const maxMonthInYear = year === nowY ? nowM : 11;
  const keys = useMemo(() => {
    if (isYearView) {
      return Array.from({ length: maxMonthInYear + 1 }, (_, i) => monthKeys(year, i)).flat();
    }
    return monthKeys(year, month);
  }, [isYearView, year, month, maxMonthInYear]);
  const pad = isYearView ? 0 : calendarPads(year, month);
  const today = calendarDay;
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [monthOpen, setMonthOpen] = useState(false);
  const [reviewTab, setReviewTab] = useState<ReviewTab>("发现");
  const [listPageOpen, setListPageOpen] = useState(false);
  const [listFilter, setListFilter] = useState<ListFilter>("newest");
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const listMenuRef = useRef<HTMLDivElement>(null);

  const monthDays = useMemo(() => keys.map((k) => data.days[k]).filter(Boolean), [data.days, keys]);

  const summary = useMemo(() => {
    let know = 0;
    let notes = 0;
    let life = 0;
    let spend = 0;
    let highlights = 0;
    monthDays.forEach((d) => {
      know += d.knowledge.length;
      if (d.shortNote.trim() || d.journal.trim()) notes += 1;
      life += dayStats(d).lifeTotal;
      spend += dayStats(d).spendTotal;
      if (d.highlight) highlights += 1;
    });
    return { know, notes, life, spend, highlights };
  }, [monthDays]);

  const journals = useMemo(
    () =>
      monthDays
        .filter((d) => d.shortNote.trim() || d.journal.trim())
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [monthDays]
  );

  const knowledgeRows = useMemo(
    () =>
      monthDays
        .flatMap((d) => d.knowledge.map((k) => ({ ...k, date: d.date })))
        .sort(byNewestAdded),
    [monthDays]
  );

  const expenses = useMemo(
    () =>
      monthDays
        .flatMap((d) => d.expenses.map((e) => ({ ...e, date: d.date })))
        .sort(byNewestAdded),
    [monthDays]
  );

  const lifeRows = useMemo(
    () =>
      monthDays
        .flatMap((d) =>
          d.life
            .filter((l) => (l.minutes || 0) > 0)
            .map((l) => ({ ...l, date: d.date }))
        )
        .sort(byNewestAdded),
    [monthDays]
  );

  useEffect(() => {
    setListPageOpen(false);
    setListFilter("newest");
    setListMenuOpen(false);
  }, [reviewTab, year, month]);

  useEffect(() => {
    if (!listMenuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!listMenuRef.current?.contains(e.target as Node)) setListMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [listMenuOpen]);

  const knowCatOptions = useMemo(
    () =>
      buildCountCatOptions(
        knowledgeRows.map((k) => normalizeKnowCat(k.category)),
        DEFAULT_CATEGORIES,
        true
      ),
    [knowledgeRows]
  );
  const spendCatOptions = useMemo(
    () =>
      buildSumCatOptions(
        expenses.map((e) => ({
          name: (e.category || "").trim() || "其他",
          value: Number(e.amount) || 0,
        })),
        EXPENSE_CATEGORIES,
        (n) => formatMoney(n)
      ),
    [expenses]
  );
  const lifeCatOptions = useMemo(
    () =>
      buildSumCatOptions(
        lifeRows.map((l) => ({
          name: (l.name || "").trim() || "其他",
          value: l.minutes || 0,
        })),
        DEFAULT_LIFE_CATALOG.map((c) => c.name),
        (n) => formatMinutesCompact(n)
      ),
    [lifeRows]
  );

  const listCatOptions =
    reviewTab === "发现" ? knowCatOptions : reviewTab === "花费" ? spendCatOptions : lifeCatOptions;

  const filteredKnowledge = useMemo(() => {
    let rows = [...knowledgeRows];
    if (listFilter !== "newest" && listFilter !== "oldest") {
      rows = rows.filter((k) => normalizeKnowCat(k.category) === listFilter);
    }
    const asc = listFilter === "oldest";
    rows.sort((a, b) => {
      const ta = a.createdAt || 0;
      const tb = b.createdAt || 0;
      if (ta !== tb) return asc ? ta - tb : tb - ta;
      return asc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });
    return rows;
  }, [knowledgeRows, listFilter]);

  const filteredExpenses = useMemo(() => {
    let rows = [...expenses];
    if (listFilter !== "newest" && listFilter !== "oldest") {
      rows = rows.filter((e) => ((e.category || "").trim() || "其他") === listFilter);
    }
    const asc = listFilter === "oldest";
    rows.sort((a, b) => {
      const byDate = asc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      if (byDate) return byDate;
      return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    });
    return rows;
  }, [expenses, listFilter]);

  const filteredLife = useMemo(() => {
    let rows = [...lifeRows];
    if (listFilter !== "newest" && listFilter !== "oldest") {
      rows = rows.filter((l) => ((l.name || "").trim() || "其他") === listFilter);
    }
    const asc = listFilter === "oldest";
    rows.sort((a, b) => {
      const byDate = asc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      if (byDate) return byDate;
      return (b.minutes || 0) - (a.minutes || 0);
    });
    return rows;
  }, [lifeRows, listFilter]);

  const isFutureMonth = (y: number, m: number) => y > nowY || (y === nowY && m > nowM);

  const shiftYear = (delta: number) => {
    const next = year + delta;
    if (next < MIN_YEAR) return;
    if (next > maxYear) {
      showFishDanmaku(FUTURE_TIP, 1600);
      return;
    }
    const nextMonth =
      month === -1 ? -1 : isFutureMonth(next, month) ? nowM : month;
    setReviewMonth(next, nextMonth);
    setMonthOpen(false);
  };

  const periodLabel = isYearView ? `${year}年全部` : `${year}年${month + 1}月`;
  const listPageTitle = `${periodLabel}${reviewTab}`;
  const journalEmpty = isYearView ? "这一年还没有日志" : "这个月还没有日志";
  const lifeParts = lifeStatParts(summary.life);
  const listStat =
    reviewTab === "发现"
      ? { value: String(filteredKnowledge.length), unit: "个发现" }
      : reviewTab === "花费"
        ? {
            value: formatSpendPlain(
              filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
            ),
            unit: "花费",
          }
        : lifeStatParts(filteredLife.reduce((s, l) => s + (l.minutes || 0), 0));

  return (
    <div className="mx-auto max-w-[430px] px-4">
      <PageHeader
        title="回顾"
        subtitle={
          <button
            type="button"
            onClick={() => setMonthOpen(true)}
            className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[15px] font-medium leading-none text-[#A39E96]"
            aria-haspopup="dialog"
          >
            <span>{periodLabel}</span>
            <IconChevron
              size={14}
              className={`text-[#A39E96] transition-transform ${monthOpen ? "-rotate-90" : "rotate-90"}`}
            />
          </button>
        }
        trailing={
          <>
            <button
              type="button"
              onClick={() => shiftYear(-1)}
              disabled={year <= MIN_YEAR}
              className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-ink disabled:opacity-25"
              aria-label="上一年"
            >
              <IconBack size={18} />
            </button>
            <button
              type="button"
              onClick={() => shiftYear(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-ink"
              aria-label="下一年"
            >
              <IconChevron size={18} />
            </button>
          </>
        }
      />

      <MonthPickerModal
        open={monthOpen}
        value={month}
        maxMonth={maxMonthInYear}
        onCancel={() => setMonthOpen(false)}
        onBlocked={() => showFishDanmaku(FUTURE_TIP, 1600)}
        onConfirm={(m) => {
          setReviewMonth(year, m);
          setMonthOpen(false);
        }}
      />

      {/* 下划线分段 + 白卡内容 */}
      <section className="mb-4">
        <div className="mb-3 flex border-b border-[#ebe4da]">
          {TAB_IDS.map((id) => {
            const active = reviewTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setReviewTab(id)}
                className={`relative flex min-w-0 flex-1 items-center justify-center border-0 bg-transparent pb-2.5 pt-1 text-[15px] transition-colors ${
                  active ? "font-semibold text-ink" : "font-medium text-muted"
                }`}
              >
                {id}
                {active ? (
                  <span
                    className="absolute inset-x-[28%] bottom-[-1px] h-[3px] rounded-full bg-[#F0C96A]"
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <Card className="px-4 pb-3.5 pt-4">
          {reviewTab === "发现" ? (
            <ChipPanel
              value={String(summary.know)}
              unit="个发现"
              empty="这段时间还没有发现"
              items={knowledgeRows}
              onViewAll={() => setListPageOpen(true)}
              renderItem={(k, i) => (
                <KnowledgeRow
                  key={k.id}
                  item={k}
                  index={i}
                  onOpen={() => openKnowledge(k.id, k.date)}
                />
              )}
            />
          ) : null}

          {reviewTab === "花费" ? (
            <ChipPanel
              value={formatSpendPlain(summary.spend)}
              unit="花费"
              empty="这段时间还没有花费"
              items={expenses}
              onViewAll={() => setListPageOpen(true)}
              renderItem={(e, i) => <ExpenseRow key={e.id} item={e} index={i} />}
            />
          ) : null}

          {reviewTab === "生活" ? (
            <ChipPanel
              value={lifeParts.value}
              unit={lifeParts.unit}
              extra={lifeParts.extra}
              empty="这段时间还没有记录生活"
              items={lifeRows}
              onViewAll={() => setListPageOpen(true)}
              renderItem={(l, i) => <LifeRow key={l.id} item={l} index={i} />}
            />
          ) : null}
        </Card>
      </section>

      {isYearView ? (
        <YearCalendar
          year={year}
          today={today}
          days={data.days}
          onOpenDay={openDay}
          onSelectMonth={(m) => setReviewMonth(year, m)}
        />
      ) : (
        <Card className="mb-4 px-3 py-4">
          <div className="mb-3 grid grid-cols-7 text-center text-[12px] text-muted">
            {["一", "二", "三", "四", "五", "六", "日"].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: pad }).map((_, i) => (
              <span key={`p${i}`} />
            ))}
            {keys.map((key) => {
              const day = data.days[key];
              const d = Number(key.slice(-2));
              const has = dayHasLeft(day);
              const hl = !!day?.highlight;
              const isToday = key === today;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={key > today}
                  onClick={() => openDay(key)}
                  className="flex aspect-square flex-col items-center justify-center rounded-full border-0 bg-transparent text-[14px] disabled:opacity-30"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isToday ? "bg-fish font-semibold text-ink" : "text-ink"
                    }`}
                  >
                    {d}
                  </span>
                  <span className="mt-px h-3 text-[10px] leading-none text-fish-deep">
                    {hl ? <IconStar size={10} stroke="#E8B24E" /> : has ? "•" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <section className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">我的日志</h2>
          <TextLink onClick={() => openPage("journal")}>全部</TextLink>
        </div>
        {journals.length ? (
          <ol className="relative m-0 list-none p-0">
            <span
              className="pointer-events-none absolute bottom-3 left-[7px] top-3 w-px bg-[#e6e1d8]"
              aria-hidden
            />
            {journals.slice(0, 2).map((d) => {
              const title = d.shortNote.trim() || d.journal.trim().split("\n")[0] || "今天";
              const body = d.shortNote.trim()
                ? d.journal.trim()
                : d.journal.trim().includes("\n")
                  ? d.journal.trim().split("\n").slice(1).join("\n").trim()
                  : "";
              const decor = journalDecor(d.date);
              return (
                <li key={d.date} className="relative mb-4 pl-7 last:mb-0">
                  <span
                    className="absolute left-0 top-[7px] h-[15px] w-[15px] rounded-full border-[3px] border-[#e6e1d8] bg-cream"
                    aria-hidden
                  />
                  <div className="mb-2 flex items-center gap-1.5 px-0.5">
                    <time className="text-[13px] font-medium text-muted">{formatCN(d.date)}</time>
                    {d.highlight ? (
                      <IconStar
                        size={14}
                        stroke="#E8B24E"
                        className="translate-y-[2px] text-[#E8B24E]"
                      />
                    ) : null}
                  </div>
                  <LongPressable
                    onClick={() => openDay(d.date, "journal")}
                    onLongPress={() => setPendingDelete(d.date)}
                    className="flex min-h-[96px] w-full items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 text-left card-shadow"
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
        ) : (
          <p className="text-[13px] text-muted">{journalEmpty}</p>
        )}
      </section>

      <PagePush
        open={listPageOpen}
        onClose={() => {
          setListPageOpen(false);
          setListMenuOpen(false);
          setListFilter("newest");
        }}
        title={listPageTitle}
        layout="bar"
        trailing={
          <div className="relative" ref={listMenuRef}>
            <button
              type="button"
              onClick={() => setListMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-ink"
              aria-label="筛选分类"
              aria-expanded={listMenuOpen}
            >
              <IconFilter size={20} />
            </button>
            {listMenuOpen ? (
              <div className="absolute right-0 top-11 z-30 max-h-[min(70vh,420px)] min-w-[168px] overflow-y-auto rounded-[14px] bg-white py-1.5 shadow-[0_10px_28px_rgba(60,50,30,0.14)]">
                {(
                  [
                    { id: "newest" as const, label: "最新" },
                    { id: "oldest" as const, label: "最早" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setListFilter(opt.id);
                      setListMenuOpen(false);
                    }}
                    className={`flex w-full border-0 bg-transparent px-3.5 py-2.5 text-left text-[14px] ${
                      listFilter === opt.id ? "font-semibold text-ink" : "font-normal text-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                {listCatOptions.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => {
                      setListFilter(opt.name);
                      setListMenuOpen(false);
                    }}
                    className={`flex w-full border-0 bg-transparent px-3.5 py-2.5 text-left text-[14px] ${
                      listFilter === opt.name ? "font-semibold text-ink" : "font-normal text-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        }
      >
        <div className="pb-4">
          <div className={`mb-5 ${ALIGN_PAD_L}`}>
            <StatHeadline value={listStat.value} unit={listStat.unit} extra={listStat.extra} />
          </div>
          <div className="space-y-2.5">
            {reviewTab === "发现"
              ? filteredKnowledge.length
                ? filteredKnowledge.map((k, i) => (
                    <KnowledgeRow
                      key={k.id}
                      item={k}
                      index={i}
                      onOpen={() => openKnowledge(k.id, k.date)}
                    />
                  ))
                : (
                    <p className="pt-6 text-center text-[13px] text-muted">这类还没有记录</p>
                  )
              : null}
            {reviewTab === "花费"
              ? filteredExpenses.length
                ? filteredExpenses.map((e, i) => (
                    <ExpenseRow key={e.id} item={e} index={i} />
                  ))
                : (
                    <p className="pt-6 text-center text-[13px] text-muted">这类还没有记录</p>
                  )
              : null}
            {reviewTab === "生活"
              ? filteredLife.length
                ? filteredLife.map((l, i) => (
                    <LifeRow key={l.id} item={l} index={i} />
                  ))
                : (
                    <p className="pt-6 text-center text-[13px] text-muted">这类还没有记录</p>
                  )
              : null}
          </div>
        </div>
      </PagePush>

      <DeleteDayConfirm
        date={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={deleteDay}
      />
    </div>
  );
}

function formatSpendPlain(n: number) {
  const v = Math.round(n * 100) / 100;
  return v % 1 === 0 ? String(v) : v.toFixed(2);
}

function normalizeKnowCat(category: string | undefined) {
  const c = (category || "").trim();
  return c || UNCATEGORIZED;
}

/** 最新添加在前：优先 createdAt，其次日期 */
function byNewestAdded(
  a: { createdAt?: number; date: string },
  b: { createdAt?: number; date: string }
) {
  const ta = a.createdAt || 0;
  const tb = b.createdAt || 0;
  if (ta !== tb) return tb - ta;
  return b.date.localeCompare(a.date);
}

type CatOption = { name: string; label: string; sortValue: number };

function collectCatNames(
  present: Iterable<string>,
  fixed: readonly string[],
  includeUncategorized: boolean
) {
  const names = new Set<string>(fixed);
  if (includeUncategorized) names.add(UNCATEGORIZED);
  for (const name of present) {
    if (name) names.add(name);
  }
  return names;
}

/** 发现：固定标签（含 0）+ 有数据的自定义；按个数从多到少 */
function buildCountCatOptions(
  values: string[],
  fixed: readonly string[],
  includeUncategorized: boolean
): CatOption[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const name = raw || (includeUncategorized ? UNCATEGORIZED : "其他");
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...collectCatNames(counts.keys(), fixed, includeUncategorized)]
    .map((name) => {
      const count = counts.get(name) || 0;
      return { name, label: `${name} ${count}`, sortValue: count };
    })
    .sort((a, b) => b.sortValue - a.sortValue || a.name.localeCompare(b.name, "zh"));
}

/** 花费/生活：按金额或时长汇总，再从多到少 */
function buildSumCatOptions(
  entries: { name: string; value: number }[],
  fixed: readonly string[],
  format: (n: number) => string
): CatOption[] {
  const sums = new Map<string, number>();
  for (const e of entries) {
    const name = e.name || "其他";
    sums.set(name, (sums.get(name) || 0) + (e.value || 0));
  }
  return [...collectCatNames(sums.keys(), fixed, false)]
    .map((name) => {
      const value = sums.get(name) || 0;
      return { name, label: `${name} ${format(value)}`, sortValue: value };
    })
    .sort((a, b) => b.sortValue - a.sortValue || a.name.localeCompare(b.name, "zh"));
}

function formatMinutesCompact(mins: number) {
  const n = Math.max(0, Math.round(mins));
  if (n < 60) return `${n}分钟`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}小时${m}分` : `${h}小时`;
}

type StatExtra = { value: string; unit: string };

/** 小时、分钟都当数字；单位单独用小字 */
function lifeStatParts(mins: number): { value: string; unit: string; extra?: StatExtra } {
  const n = Math.max(0, Math.round(mins));
  if (n < 60) return { value: String(n), unit: "分钟" };
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (!m) return { value: String(h), unit: "小时" };
  return { value: String(h), unit: "小时", extra: { value: String(m), unit: "分" } };
}

function StatHeadline({
  value,
  unit,
  extra,
  className = "",
}: {
  value: string;
  unit: string;
  extra?: StatExtra;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 items-baseline ${className}`.trim()}>
      <span className="relative inline-block text-[30px] font-bold leading-none tracking-tight text-ink">
        {value}
        <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-[#F0C96A]" />
      </span>
      <span className="ml-1.5 text-[13px] font-medium text-muted">{unit}</span>
      {extra ? (
        <>
          <span className="ml-2 text-[22px] font-bold leading-none tracking-tight text-ink">
            {extra.value}
          </span>
          <span className="ml-1 text-[13px] font-medium text-muted">{extra.unit}</span>
        </>
      ) : null}
    </div>
  );
}

function ChipPanel<T>({
  value,
  unit,
  extra,
  empty,
  items,
  onViewAll,
  renderItem,
}: {
  value: string;
  unit: string;
  extra?: StatExtra;
  empty: string;
  items: T[];
  onViewAll: () => void;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const visible = items.slice(0, PREVIEW_COUNT);
  const canViewAll = items.length > PREVIEW_COUNT;

  return (
    <div>
      <div className={`mb-5 ${ALIGN_PAD_L}`}>
        <StatHeadline value={value} unit={unit} extra={extra} />
      </div>
      {items.length ? (
        <>
          <div className="space-y-2.5">{visible.map((item, i) => renderItem(item, i))}</div>
          {canViewAll ? (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={onViewAll}
                className="inline-flex items-center gap-0.5 border-0 bg-transparent px-2 py-1.5 text-[13px] font-medium text-muted"
              >
                查看全部
                <IconChevron size={14} className="text-[#C8C4BC]" />
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-[13px] text-muted">{empty}</p>
      )}
    </div>
  );
}

function RowBadge({ index }: { index: number }) {
  const b = ROW_BADGES[index % ROW_BADGES.length]!;
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/65"
      style={{ background: b.bg }}
      aria-hidden
    >
      <BadgeGlyph kind={b.kind} />
    </span>
  );
}

function BadgeGlyph({ kind }: { kind: (typeof ROW_BADGES)[number]["kind"] }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "star") {
    return (
      <svg {...common}>
        <path d="M12 3.8 14.2 9l5.5.5-4.2 3.6 1.3 5.4L12 15.9 7.2 18.5l1.3-5.4L4.3 9.5 9.8 9 12 3.8Z" />
      </svg>
    );
  }
  if (kind === "sun") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.2 6.2l1.5 1.5M16.3 16.3l1.5 1.5M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5" />
      </svg>
    );
  }
  if (kind === "cloud") {
    return (
      <svg {...common}>
        <path d="M7.5 16.5h9.2a3.3 3.3 0 0 0 .4-6.6 4.6 4.6 0 0 0-8.7-1.3A3.2 3.2 0 0 0 7.5 16.5Z" />
      </svg>
    );
  }
  if (kind === "book") {
    return (
      <svg {...common}>
        <path d="M5 6.2A2 2 0 0 1 7 4.2h11v14H7a2 2 0 0 0-2 2" />
        <path d="M5 6.2v14" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 19s-6-3.8-6-8.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 6 2.8C18 15.2 12 19 12 19Z" />
      <path d="M12 8V4.5" />
    </svg>
  );
}

function CategoryTag({ label }: { label: string }) {
  const s = tagStyle(label);
  return (
    <span
      className="max-w-[72px] shrink-0 truncate rounded-full px-2 py-1 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.ink }}
    >
      {label}
    </span>
  );
}

function ExpenseRow({
  item,
  index,
}: {
  item: ExpenseItem & { date: string };
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="overflow-hidden rounded-[14px]"
      style={{ background: ROW_BG, boxShadow: ROW_SHADOW }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`flex w-full items-center gap-3 border-0 bg-transparent ${ROW_PAD_X} py-3 text-left`}
        aria-expanded={expanded}
      >
        <RowBadge index={index} />
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-[14px] text-ink">{item.note || item.category}</strong>
          <span className="mt-0.5 block text-[12px] text-muted">
            {formatCN(item.date)}
            {item.category ? ` · ${item.category}` : ""}
          </span>
        </span>
        <CategoryTag label={formatMoney(item.amount)} />
      </button>
      {expanded ? (
        <div className="space-y-2 border-t border-[#ebe4da] px-3 pb-3 pt-2.5 text-[13px] leading-relaxed text-muted">
          <p>
            <span className="text-ink/70">分类</span> · {item.category || "其他"}
          </p>
          {item.payment ? (
            <p>
              <span className="text-ink/70">支付</span> · {item.payment}
            </p>
          ) : null}
          {item.note?.trim() ? (
            <p>
              <span className="text-ink/70">备注</span> · {item.note.trim()}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function KnowledgeRow({
  item,
  onOpen,
}: {
  item: KnowledgeItem & { date: string };
  index: number;
  onOpen: () => void;
}) {
  const [bg, color] = thumbPalette(item.category || "");
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-3 rounded-[14px] border-0 ${ROW_PAD_X} py-3 text-left`}
      style={{
        background: ROW_BG,
        boxShadow: ROW_SHADOW,
      }}
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
        style={{ background: bg, color }}
        aria-hidden
      >
        <ThumbFish size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-[14px] text-ink">{item.title || "未命名"}</strong>
        <span className="mt-0.5 block text-[12px] text-muted">{formatCN(item.date)}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {item.starred ? <IconStarOutline size={14} stroke="#E8B24E" /> : null}
        {item.category ? (
          <span
            className="max-w-[72px] shrink-0 truncate rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: bg, color }}
          >
            {item.category}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function LifeRow({
  item,
  index,
}: {
  item: LifeItem & { date: string };
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const timeRange = lifeTimeRange(item.startHm, item.minutes);
  const note = item.note?.trim() || "";
  return (
    <div
      className="overflow-hidden rounded-[14px]"
      style={{ background: ROW_BG, boxShadow: ROW_SHADOW }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`flex w-full items-center gap-3 border-0 bg-transparent ${ROW_PAD_X} py-3 text-left`}
        aria-expanded={expanded}
      >
        <RowBadge index={index} />
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-[14px] text-ink">{item.name || "一段时间"}</strong>
          <span className="mt-0.5 block text-[12px] text-muted">
            {formatCN(item.date)}
            {item.startHm ? ` · ${item.startHm}` : ""}
          </span>
        </span>
        <CategoryTag label={formatMinutes(item.minutes)} />
      </button>
      {expanded ? (
        <div className="space-y-2 border-t border-[#ebe4da] px-3 pb-3 pt-2.5 text-[13px] leading-relaxed text-muted">
          {timeRange ? (
            <p>
              <span className="text-ink/70">时段</span> · {timeRange}
            </p>
          ) : null}
          {note ? (
            <p>
              <span className="text-ink/70">备注</span> · {note}
            </p>
          ) : null}
          {!timeRange && !note ? (
            <p>
              <span className="text-ink/70">时长</span> · {formatMinutes(item.minutes)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function lifeEndHm(startHm: string, minutes: number) {
  const [h, m] = startHm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const total = h * 60 + m + Math.max(0, minutes);
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

function lifeTimeRange(startHm?: string, minutes?: number) {
  if (!startHm || !minutes || minutes <= 0) return "";
  const end = lifeEndHm(startHm, minutes);
  if (!end) return "";
  return `${startHm} – ${end}`;
}
