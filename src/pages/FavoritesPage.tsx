import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useApp } from "../store/AppContext";
import { formatCN } from "../lib/storage";
import { dayMatchesDateQuery, parseDateQuery } from "../lib/dateQuery";
import { categoryTone } from "../lib/categoryColor";
import { Card } from "../components/ui";
import { LongPressable } from "../components/LongPressable";
import { PageHeader } from "../components/PageHeader";
import {
  IconChevron,
  IconClose,
  IconFilter,
  IconSearch,
  IconStar,
  IconStarOutline,
} from "../components/Icons";
import type { KnowledgeItem } from "../types/day";
import { UNCATEGORIZED } from "../types/day";

type KnowledgeSort = "newest" | "oldest" | "most" | "least" | "starred";
type Row = KnowledgeItem & { date: string };

const SORT_KEY = "momoyu.knowledgeSort.v1";
const SORT_OPTIONS: { id: KnowledgeSort; label: string }[] = [
  { id: "newest", label: "最新" },
  { id: "oldest", label: "最早" },
  { id: "most", label: "复习最多" },
  { id: "least", label: "复习最少" },
  { id: "starred", label: "已收藏" },
];

function loadSort(): KnowledgeSort {
  try {
    const v = localStorage.getItem(SORT_KEY);
    if (v === "newest" || v === "oldest" || v === "most" || v === "least" || v === "starred") return v;
  } catch {
    /* ignore */
  }
  return "newest";
}

function saveSort(sort: KnowledgeSort) {
  try {
    localStorage.setItem(SORT_KEY, sort);
  } catch {
    /* ignore */
  }
}

function reviewCountOf(k: KnowledgeItem) {
  return typeof k.reviewCount === "number" && k.reviewCount > 0 ? Math.floor(k.reviewCount) : 0;
}

function sortRows(rows: Row[], sort: KnowledgeSort) {
  const next = [...rows];
  if (sort === "starred") {
    return next
      .filter((k) => !!k.starred)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  next.sort((a, b) => {
    if (sort === "newest") return b.createdAt - a.createdAt;
    if (sort === "oldest") return a.createdAt - b.createdAt;
    const ra = reviewCountOf(a);
    const rb = reviewCountOf(b);
    if (sort === "most") return rb - ra || b.createdAt - a.createdAt;
    return ra - rb || b.createdAt - a.createdAt;
  });
  return next;
}

export function FavoritesPage() {
  const {
    data,
    search,
    setSearch,
    filter,
    setFilter,
    openKnowledge,
    openPage,
    openLootReview,
    showToast,
    deleteKnowledge,
    toggleKnowledgeStar,
  } = useApp();

  const [sort, setSort] = useState<KnowledgeSort>(() => loadSort());
  const [sortOpen, setSortOpen] = useState(false);
  const sortWrapRef = useRef<HTMLDivElement>(null);

  const [armedId, setArmedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const chipDrag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const chipSuppressClick = useRef(false);

  useEffect(() => {
    if (!sortOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!sortWrapRef.current?.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [sortOpen]);

  /** 点叉号以外任意处，退出删除待命 */
  useEffect(() => {
    if (!armedId || pendingDelete) return;
    const onPointer = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el?.closest?.(`[data-delete-x="${armedId}"]`)) return;
      setArmedId(null);
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [armedId, pendingDelete]);

  const dismissDeleteConfirm = () => {
    setPendingDelete(null);
    setArmedId(null);
  };

  const all = useMemo(() => {
    const rows: Row[] = [];
    Object.values(data.days).forEach((day) => {
      day.knowledge.forEach((k) => rows.push({ ...k, date: day.date }));
    });
    return rows;
  }, [data.days]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    all.forEach((k) => counts.set(k.category, (counts.get(k.category) || 0) + 1));
    // 胶囊：全部 + 仅有知识的分类（含「未分类」，空的不显示）
    const used = [...counts.keys()]
      .filter((c) => (counts.get(c) || 0) > 0)
      .sort((a, b) => {
        if (a === UNCATEGORIZED) return -1;
        if (b === UNCATEGORIZED) return 1;
        return a.localeCompare(b, "zh");
      });
    return ["全部", ...used];
  }, [all]);

  useEffect(() => {
    if (filter !== "全部" && !categories.includes(filter)) setFilter("全部");
  }, [categories, filter, setFilter]);

  const qRaw = search.trim();
  const q = qRaw.toLowerCase();
  const dateParsed = parseDateQuery(qRaw);

  const list = useMemo(() => {
    let rows = all;
    if (filter !== "全部") rows = rows.filter((k) => k.category === filter);
    if (sort === "starred") rows = rows.filter((k) => !!k.starred);

    if (dateParsed) {
      rows = rows.filter((k) => dayMatchesDateQuery(k.date, dateParsed));
    } else if (q) {
      rows = rows.filter(
        (k) =>
          k.title.toLowerCase().includes(q) ||
          k.note.toLowerCase().includes(q) ||
          k.category.toLowerCase().includes(q)
      );
    }

    return sortRows(rows, sort);
  }, [all, filter, dateParsed, q, sort]);

  const searching = !!qRaw;
  const emptySearch = searching && list.length === 0;

  const chooseSort = (id: KnowledgeSort) => {
    setSort(id);
    saveSort(id);
    setSortOpen(false);
  };

  useEffect(() => {
    const el = chipScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!dx) return;
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += dx;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [all.length]);

  const onChipPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // 触控走原生横向滚动；鼠标拖拽补上（桌面滚轮不好横滑）
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = chipScrollRef.current;
    if (!el) return;
    chipDrag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  };

  const onChipPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = chipDrag.current;
    const el = chipScrollRef.current;
    if (!drag || !el) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    if (drag.moved) el.scrollLeft = drag.left - dx;
  };

  const onChipPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = chipDrag.current;
    chipDrag.current = null;
    try {
      chipScrollRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (drag?.moved) chipSuppressClick.current = true;
  };

  return (
    <div className="relative mx-auto max-w-[430px] px-4">
      <PageHeader
        title="知识"
        subtitle={`${all.length} 条小发现`}
        trailing={
          <div className="relative" ref={sortWrapRef}>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-ink"
              aria-label="排序"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((v) => !v)}
            >
              <IconFilter size={20} />
            </button>
            {sortOpen ? (
              <div className="absolute right-0 top-9 z-30 max-h-56 w-[132px] overflow-y-auto rounded-[14px] bg-white py-1.5 shadow-[0_10px_28px_rgba(60,50,30,0.14)]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => chooseSort(opt.id)}
                    className={`flex w-full border-0 bg-transparent px-3.5 py-2.5 text-left text-[14px] ${
                      sort === opt.id ? "font-semibold text-ink" : "font-normal text-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        }
      />

      <label className="mb-5 flex h-11 items-center gap-2 rounded-[22px] bg-white px-4 shadow-[0_1px_4px_rgba(160,145,130,0.06)]">
        <IconSearch size={18} className="shrink-0 text-muted" />
        <input
          id="fav-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder=""
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        {search ? (
          <button
            type="button"
            aria-label="清空搜索"
            onClick={() => setSearch("")}
            className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-0 bg-[#EFECE7] text-[#9A958C]"
          >
            <IconClose size={14} />
          </button>
        ) : null}
      </label>

      {all.length ? (
        <div
          ref={chipScrollRef}
          className="mb-4 flex w-full min-w-0 cursor-grab gap-2 overflow-x-auto overscroll-x-contain pb-1 touch-pan-x active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onPointerDown={onChipPointerDown}
          onPointerMove={onChipPointerMove}
          onPointerUp={onChipPointerUp}
          onPointerCancel={onChipPointerUp}
        >
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                if (chipSuppressClick.current) {
                  chipSuppressClick.current = false;
                  return;
                }
                setFilter(c);
              }}
              className={`shrink-0 rounded-full border-0 px-3.5 py-1.5 text-[13px] ${
                filter === c ? "bg-fish font-semibold text-ink" : "bg-white text-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {!searching && filter === "全部" ? (
        <button
          type="button"
          onClick={openLootReview}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-[22px] border border-[#f0ebe4] bg-white py-3 pl-3.5 pr-3 text-left shadow-[0_1px_4px_rgba(160,145,130,0.05)]"
        >
          <span className="flex h-[18px] w-1 shrink-0 rounded-full bg-fish" aria-hidden />
          <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">随机复习一条</span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fish text-ink shadow-[0_2px_8px_rgba(232,178,78,0.28)]">
            <IconChevron size={16} />
          </span>
        </button>
      ) : null}

      <div className="space-y-3">
        {list.length ? (
          list.map((k) => {
            const count = reviewCountOf(k);
            const armed = armedId === k.id;
            const tone = categoryTone(k.category);
            return (
              <div key={k.id} className="relative overflow-visible">
                <LongPressable
                  onClick={() => {
                    if (armedId) {
                      setArmedId(null);
                      return;
                    }
                    openKnowledge(k.id, k.date);
                  }}
                  onLongPress={() => setArmedId(k.id)}
                  className="w-full rounded-[20px] border-0 bg-white px-4 py-4 text-left card-shadow"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <h3 className="min-w-0 flex-1 pr-1 text-[16px] font-semibold leading-snug text-ink">
                      {k.title}
                    </h3>
                    <span
                      className={`shrink-0 pt-0.5 text-right text-[12px] text-[#B8B2A8] ${
                        armed ? "invisible" : ""
                      }`}
                    >
                      {count > 0 ? `已复习 ${count} 次` : "未复习"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                      style={{ background: tone.bg, color: tone.ink }}
                    >
                      {k.category}
                    </span>
                    <span className="min-w-0 flex-1 text-muted">{formatCN(k.date)}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={k.starred ? "取消收藏" : "收藏"}
                      className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const next = !k.starred;
                        toggleKnowledgeStar(k.id);
                        showToast(next ? "已收藏" : "已取消收藏");
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.stopPropagation();
                        e.preventDefault();
                        const next = !k.starred;
                        toggleKnowledgeStar(k.id);
                        showToast(next ? "已收藏" : "已取消收藏");
                      }}
                    >
                      {k.starred ? (
                        <IconStar
                          size={18}
                          className="fill-fish-deep text-fish-deep"
                          stroke="#E8B24E"
                        />
                      ) : (
                        <IconStarOutline size={18} className="text-muted" />
                      )}
                    </span>
                  </div>
                </LongPressable>
                {armed ? (
                  <button
                    type="button"
                    data-delete-x={k.id}
                    aria-label="删除"
                    className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-[#E07070] text-white shadow-[0_2px_8px_rgba(200,80,80,0.35)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(k);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <IconClose size={14} />
                  </button>
                ) : null}
              </div>
            );
          })
        ) : emptySearch ? (
          <Card className="px-5 py-10 text-center">
            <img
              src="/icons/fish-sad.png?v=7"
              alt=""
              width={72}
              height={72}
              className="mx-auto mb-3 h-[72px] w-[72px] object-contain"
              draggable={false}
            />
            <strong className="block text-[16px] font-semibold">没有找到相关内容</strong>
            <p className="mt-2 text-[13px] text-muted">试试换个关键词或日期</p>
          </Card>
        ) : filter === UNCATEGORIZED ? (
          <p className="pt-1 text-center text-[14px] text-muted">没有未分类的知识</p>
        ) : (
          <Card className="px-5 py-10 text-center">
            <img
              src="/icons/fish-sad.png?v=7"
              alt=""
              width={72}
              height={72}
              className="mx-auto mb-3 h-[72px] w-[72px] object-contain"
              draggable={false}
            />
            <strong className="block text-[16px] font-semibold">这里还空空的</strong>
            <p className="mt-2 text-[13px] text-muted">看到有趣的东西，就捞一条回来吧。</p>
            <button
              type="button"
              onClick={() => openPage("discovery")}
              className="mt-4 rounded-[16px] border-0 bg-fish px-4 py-2.5 text-[14px] font-semibold"
            >
              记下第一个发现
            </button>
          </Card>
        )}
      </div>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-10"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 border-0 bg-black/30"
            aria-label="关闭"
            onClick={dismissDeleteConfirm}
          />
          <div className="relative z-[1] w-full max-w-[300px] rounded-[22px] bg-white px-5 pb-5 pt-6 shadow-[0_16px_40px_rgba(60,50,30,0.18)]">
            <h2 className="mb-2 text-center text-[18px] font-bold text-ink">删除这条知识？</h2>
            <p className="mb-5 text-center text-[13px] leading-relaxed text-muted">删除后无法恢复。</p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={dismissDeleteConfirm}
                className="flex-1 rounded-[14px] border-0 bg-cream-deep py-3 text-[15px] font-medium text-muted"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteKnowledge(pendingDelete.id, pendingDelete.date);
                  setPendingDelete(null);
                  setArmedId(null);
                  showToast("已删除");
                }}
                className="flex-1 rounded-[14px] border-0 bg-[#E07070] py-3 text-[15px] font-semibold text-white"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
