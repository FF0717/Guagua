import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useApp } from "../store/AppContext";
import { BottomSheet } from "../components/BottomSheet";
import { PagePush } from "../components/PagePush";
import { FishPageHero } from "../components/FishPageHero";
import { TimePickerModal } from "../components/TimePickerModal";
import { DatePickerModal } from "../components/DatePickerModal";
import { SwipeDeleteRow } from "../components/SwipeDeleteRow";
import { Fish } from "../components/Fish";
import { GhostButton, PrimaryButton } from "../components/ui";
import {
  IconBook,
  IconChevron,
  IconClock,
  IconBack,
  IconHand,
  IconList,
  IconNet,
  IconPen,
  IconPlus,
  IconStar,
  IconStarOutline,
  IconWallet,
  IconClose,
} from "../components/Icons";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, DEFAULT_CATEGORIES, UNCATEGORIZED, type Day } from "../types/day";
import { dayStats, formatCN, formatMinutes, formatMoney, mergeLifeCatalog, resolveFishName, todayKey } from "../lib/storage";
import { categoryTone, thumbPalette } from "../lib/categoryColor";
import { ThumbFish } from "../components/ThumbFish";
import { useSwipeBack } from "../hooks/useSwipeBack";

const DEFAULT_CATEGORY_SET = new Set(DEFAULT_CATEGORIES);

export function Sheets() {
  const app = useApp();
  const {
    sheet,
    closeSheet,
    openSheet,
    openPage,
    closePage,
    page,
    addKnowledge,
    addLife,
    addExpense,
    saveNote,
    saveHighlight,
    data,
    today,
    selectedDay,
    selectedKnowledgeId,
    toggleHighlight,
    showToast,
    celebrate,
    setTab,
    updateSettings,
  } = app;

  const allKnowledge = useMemo(() => {
    const rows: { id: string; date: string }[] = [];
    Object.values(data.days).forEach((day) => {
      day.knowledge.forEach((k) => rows.push({ id: k.id, date: day.date }));
    });
    return rows;
  }, [data.days]);

  const lifeCatalog = useMemo(
    () => mergeLifeCatalog(data.settings.lifeCatalog),
    [data.settings.lifeCatalog]
  );

  return (
    <>
      <PokeSheet
        open={sheet === "poke"}
        onClose={closeSheet}
        onPet={() => {
          celebrate();
          closeSheet();
        }}
        onRecords={() => {
          closeSheet();
          setTab("favorites");
        }}
        onMemory={() => {
          if (!allKnowledge.length) {
            showToast("还没有回忆可捞。");
            return;
          }
          const pick = allKnowledge[Math.floor(Math.random() * allKnowledge.length)];
          closeSheet();
          app.openKnowledge(pick.id, pick.date);
        }}
        onFeed={() => {
          celebrate("highlight");
          closeSheet();
        }}
        onLeave={(k) => {
          closeSheet();
          if (k === "highlight") openSheet("highlight");
          else openPage(k);
        }}
      />
      <DiscoverySheet
        open={page === "discovery"}
        onClose={closePage}
        categories={data.settings.categories.filter((c) => c !== UNCATEGORIZED)}
        editItem={
          app.knowledgeEditId
            ? (() => {
                for (const day of Object.values(data.days)) {
                  const item = day.knowledge.find((k) => k.id === app.knowledgeEditId);
                  if (item) return item;
                }
                return null;
              })()
            : null
        }
        onSave={(item) => {
          if (app.knowledgeEditId) {
            app.updateKnowledge(app.knowledgeEditId, item);
            showToast("已更新");
          } else addKnowledge(item);
        }}
        onAddCategory={(name) => {
          if (name === UNCATEGORIZED || DEFAULT_CATEGORY_SET.has(name)) {
            showToast("这是系统分类，换个名字吧");
            return;
          }
          updateSettings({
            categories: [...data.settings.categories.filter((c) => c !== name && c !== UNCATEGORIZED), name],
          });
        }}
        onRemoveCategory={(name) => {
          app.removeKnowledgeCategory(name);
        }}
        showToast={showToast}
      />
      <LifeSheet
        open={page === "life"}
        onClose={closePage}
        catalog={lifeCatalog}
        onAdd={addLife}
        showToast={showToast}
      />
      <SpendSheet open={page === "spend"} onClose={closePage} onSave={addExpense} showToast={showToast} />
      <HarvestPage
        open={
          page === "harvest" ||
          (page === "note" && app.noteReturnTo === "harvest") ||
          (sheet === "detail" && app.detailBackTo === "harvest")
        }
        onClose={closePage}
        day={today}
        focus={app.dayFocus}
      />
      <HighlightSheet open={sheet === "highlight"} onClose={closeSheet} value={today.highlightText} onSave={saveHighlight} />
      <DaySheet
        open={sheet === "day" || (sheet === "detail" && app.detailBackTo === "day")}
        onClose={closeSheet}
        day={selectedDay ? data.days[selectedDay] : null}
        date={selectedDay}
        focus={app.dayFocus}
        onToggleHighlight={toggleHighlight}
        onOpenDetail={(id) => app.openKnowledge(id, selectedDay || undefined)}
      />
      <DetailSheet
        open={sheet === "detail"}
        onClose={closeSheet}
        itemId={selectedKnowledgeId}
        days={data.days}
      />
      <LootReviewPage
        open={page === "loot"}
        onClose={closePage}
        itemId={app.lootKnowledgeId}
        days={data.days}
        onConfirm={() => {
          if (!app.lootKnowledgeId) return;
          const id = app.lootKnowledgeId;
          // 先关弹卡、打开详情，复习计数放到下一帧再写，避免同帧大对象克隆 + localStorage 卡一下
          closePage();
          app.openKnowledge(id, undefined, { fromLoot: true });
          requestAnimationFrame(() => {
            app.bumpKnowledgeReview(id);
          });
        }}
      />
      <NoteSheet
        open={page === "note"}
        onClose={closePage}
        date={app.noteEditDate}
        dateLocked={app.noteDateLocked}
        days={data.days}
        onSave={saveNote}
        showToast={showToast}
        showFishHero={!app.noteDateLocked}
      />
      <BackupSheet open={sheet === "backup"} onClose={closeSheet} showToast={showToast} />
    </>
  );
}

function PokeSheet({
  open,
  onClose,
  onPet,
  onRecords,
  onMemory,
  onFeed,
  onLeave,
}: {
  open: boolean;
  onClose: () => void;
  onPet: () => void;
  onRecords: () => void;
  onMemory: () => void;
  onFeed: () => void;
  onLeave: (k: "discovery" | "life" | "spend" | "note" | "highlight") => void;
}) {
  const circles = [
    { label: "摸摸我", Icon: IconHand, color: "bg-spend", onClick: onPet },
    { label: "看看记录", Icon: IconList, color: "bg-know", onClick: onRecords },
    { label: "捞一条回忆", Icon: IconNet, color: "bg-life", onClick: onMemory },
    { label: "喂点星星", Icon: IconStar, color: "bg-note", onClick: onFeed },
  ];
  const leave = [
    { k: "discovery" as const, Icon: IconBook, label: "一个发现", color: "bg-know text-know-ink" },
    { k: "life" as const, Icon: IconClock, label: "一段时间", color: "bg-life text-life-ink" },
    { k: "spend" as const, Icon: IconWallet, label: "一笔花费", color: "bg-spend text-spend-ink" },
    { k: "note" as const, Icon: IconPen, label: "一句话", color: "bg-note text-note-ink" },
    { k: "highlight" as const, Icon: IconStar, label: "一个高光", color: "bg-highlight text-ink" },
  ];

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="mb-5 flex flex-col items-center text-center">
        <Fish size={72} className="mb-2" />
        <h2 className="text-[18px] font-semibold text-ink">今天也想摸一下吗</h2>
      </div>
      <div className="mb-5 grid grid-cols-4 gap-2">
        {circles.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={c.onClick}
            className="flex flex-col items-center gap-2 border-0 bg-transparent"
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-full ${c.color} text-ink`}>
              <c.Icon size={22} />
            </span>
            <span className="text-[11px] text-muted">{c.label}</span>
          </button>
        ))}
      </div>
      <p className="mb-2 text-[13px] text-muted">或者留下一点</p>
      <div className="space-y-2">
        {leave.map((o) => (
          <button
            key={o.k}
            type="button"
            onClick={() => onLeave(o.k)}
            className={`${o.color} flex w-full items-center gap-3 rounded-[18px] border-0 px-4 py-3.5 text-left text-[15px] font-medium`}
          >
            <o.Icon size={20} />
            {o.label}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

function DiscoverySheet({
  open,
  onClose,
  categories,
  editItem,
  onSave,
  onAddCategory,
  onRemoveCategory,
  showToast,
}: {
  open: boolean;
  onClose: () => void;
  categories: string[];
  editItem?: {
    id: string;
    title: string;
    note: string;
    category: string;
    source?: string;
    tags?: string[];
  } | null;
  onSave: (item: {
    title: string;
    note: string;
    category: string;
    source?: string;
    tags?: string[];
  }) => void;
  onAddCategory: (name: string) => void;
  onRemoveCategory: (name: string) => void;
  showToast: (msg: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [pickCategory, setPickCategory] = useState(false);
  const [markedCategory, setMarkedCategory] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const categoryBeforePickRef = useRef("");
  const categoryDraftRef = useRef("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const longPressRef = useRef<{ timer: number | null; name: string | null }>({
    timer: null,
    name: null,
  });
  const suppressClickRef = useRef(false);
  const NOTE_MAX = 1000;
  const editing = !!editItem;

  useEffect(() => {
    categoryDraftRef.current = categoryDraft;
  }, [categoryDraft]);

  useEffect(() => {
    if (!open) return;
    if (editItem) {
      setTitle(editItem.title);
      setNote(editItem.note);
      setCategory(editItem.category);
      setSource(editItem.source || "");
      setTags(editItem.tags ? [...editItem.tags] : []);
    } else {
      setTitle("");
      setNote("");
      setCategory("");
      setSource("");
      setTags([]);
    }
    setTagDraft("");
    setCustom("");
    setPickCategory(false);
    setMarkedCategory(null);
    setDeletingCategory(null);
    setCategoryDraft("");
    categoryDraftRef.current = "";
    // 仅在打开或切换编辑目标时重置，避免保存过程中被父组件重渲染冲掉输入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem?.id]);

  useEffect(() => {
    if (!pickCategory) {
      setMarkedCategory(null);
      setDeletingCategory(null);
    }
  }, [pickCategory]);

  const openCategoryPicker = () => {
    categoryBeforePickRef.current = category;
    setCategoryDraft(category);
    categoryDraftRef.current = category;
    setPickCategory(true);
  };

  const commitCategoryPicker = () => {
    // 以当前草稿为准（空字符串 = 取消选中）
    const next = categoryDraftRef.current;
    setCategory(next);
    setCategoryDraft(next);
    setMarkedCategory(null);
    setPickCategory(false);
  };

  const cancelCategoryPicker = () => {
    setCategory(categoryBeforePickRef.current);
    setCategoryDraft(categoryBeforePickRef.current);
    categoryDraftRef.current = categoryBeforePickRef.current;
    setMarkedCategory(null);
    setPickCategory(false);
  };

  useEffect(() => {
    return () => {
      if (longPressRef.current.timer) window.clearTimeout(longPressRef.current.timer);
    };
  }, []);

  const addTag = () => {
    const name = tagDraft.trim().slice(0, 12);
    if (!name) {
      showToast("先输入标签名");
      tagInputRef.current?.focus();
      return;
    }
    if (tags.includes(name)) {
      showToast("标签已添加");
      setTagDraft("");
      return;
    }
    if (tags.length >= 8) {
      showToast("最多 8 个标签");
      return;
    }
    setTags((t) => [...t, name]);
    setTagDraft("");
    tagInputRef.current?.focus();
  };

  const addCustomCategory = () => {
    const name = custom.trim().slice(0, 12);
    if (!name) {
      showToast("先输入分类名");
      return;
    }
    if (name === UNCATEGORIZED || DEFAULT_CATEGORY_SET.has(name)) {
      showToast("这是系统分类，换个名字吧");
      return;
    }
    if (categories.includes(name)) {
      setCategoryDraft(name);
      categoryDraftRef.current = name;
      showToast("分类已存在，已帮你选中");
      return;
    }
    onAddCategory(name);
    setCategoryDraft(name);
    categoryDraftRef.current = name;
    setCustom("");
    showToast(`已添加分类「${name}」`);
  };

  const clearLongPress = () => {
    if (longPressRef.current.timer) {
      window.clearTimeout(longPressRef.current.timer);
      longPressRef.current.timer = null;
    }
    longPressRef.current.name = null;
  };

  const startLongPress = (name: string) => {
    // 内置 14 类不可删，长按无效
    if (DEFAULT_CATEGORY_SET.has(name)) return;
    clearLongPress();
    longPressRef.current.name = name;
    longPressRef.current.timer = window.setTimeout(() => {
      longPressRef.current.timer = null;
      const target = longPressRef.current.name;
      longPressRef.current.name = null;
      if (!target) return;
      suppressClickRef.current = true;
      setMarkedCategory(target);
    }, 480);
  };

  const askDeleteCategory = (name: string) => {
    if (DEFAULT_CATEGORY_SET.has(name)) return;
    setDeletingCategory(name);
  };

  const confirmDeleteCategory = () => {
    if (!deletingCategory) return;
    const name = deletingCategory;
    onRemoveCategory(name);
    if (category === name) setCategory(UNCATEGORIZED);
    if (categoryDraft === name) {
      setCategoryDraft(UNCATEGORIZED);
      categoryDraftRef.current = UNCATEGORIZED;
    }
    if (categoryBeforePickRef.current === name) categoryBeforePickRef.current = UNCATEGORIZED;
    setDeletingCategory(null);
    setMarkedCategory(null);
    showToast(`已删除，相关知识归入「未分类」`);
  };

  const exitMarkMode = () => {
    setDeletingCategory(null);
    setMarkedCategory(null);
  };

  const submit = () => {
    if (!title.trim()) {
      showToast("给这个知识取个标题吧");
      return;
    }
    if (!note.trim()) {
      showToast("内容也写一点吧");
      return;
    }
    if (!category) {
      showToast("选一个分类");
      return;
    }
    onSave({
      title: title.trim(),
      note: note.trim(),
      category,
      source: source.trim() || undefined,
      tags: tags.length ? tags : undefined,
    });
  };

  const card = "card-border rounded-[22px] bg-white px-4 py-3.5";
  const sectionTitle = "text-[16px] font-bold text-ink";

  return (
    <>
      <PagePush
        open={open}
        onClose={onClose}
        title={editing ? "编辑知识" : "学一学"}
        layout="bar"
        zIndex={60}
      >
        <FishPageHero
          title={editing ? "有什么新发现吗！" : "发现什么有趣的知识啦？"}
          sub={editing ? "保存后会覆盖原来的内容" : "试着用自己的话概括一下～"}
          fishSrc={editing ? "/icons/page-fish-edit.png?v=1" : "/icons/page-fish.png?v=1"}
          fishLarge={editing}
          noShadow={editing}
          fishDown={editing}
          bubbleTight
        />
        <section className={`mb-3.5 ${card}`}>
          <label className="block">
            <span className={`mb-1.5 block ${sectionTitle}`}>标题</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="给这个知识取个标题"
              className="w-full border-0 bg-transparent py-1 text-[15px] text-ink outline-none placeholder:text-muted"
            />
          </label>
          <div className="my-2.5 h-px bg-line" />
          <label className="block">
            <span className={`mb-1.5 block ${sectionTitle}`}>内容</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              rows={6}
              maxLength={NOTE_MAX}
              placeholder="记录你的发现、理解或感悟..."
              className="w-full resize-none border-0 bg-transparent py-1 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted"
            />
          </label>
          <div className="mt-1 flex items-center justify-end">
            <span className="text-[12px] text-muted">
              {note.length}/{NOTE_MAX}
            </span>
          </div>
        </section>

        <button
          type="button"
          onClick={openCategoryPicker}
          className="card-border mb-3.5 flex min-h-[68px] w-full items-center justify-between rounded-[22px] bg-white px-4 py-5 text-left"
        >
          <span className={sectionTitle}>分类</span>
          <span className={`flex items-center gap-0.5 text-[14px] font-normal ${category ? "text-know-ink" : "text-muted"}`}>
            {category || "选择分类"}
            <IconChevron size={14} className="mr-0.5" />
          </span>
        </button>

        <div className={`mb-3.5 ${card}`}>
          <label className="block">
            <span className={`mb-1.5 block ${sectionTitle}`}>来源 (可选)</span>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={80}
              placeholder="书籍 / 文章 / 课程 / 播客 / 视频 ..."
              className="w-full border-0 bg-transparent py-0.5 text-[14px] text-ink outline-none placeholder:text-muted"
            />
          </label>
          <div className="my-3 h-px bg-line" />
          <span className={`mb-2 block ${sectionTitle}`}>标签 (可选)</span>
          {tags.length ? (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags((list) => list.filter((x) => x !== t))}
                  className="rounded-full border-0 bg-cream-deep px-2.5 py-1.5 text-[12px] text-ink"
                >
                  {t} ×
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <input
              ref={tagInputRef}
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              maxLength={12}
              placeholder="写个关键词，如：科普"
              className="min-w-0 flex-1 rounded-[12px] border-0 bg-cream-deep px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={addTag}
              className="-mr-0.5 flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-know-ink"
              aria-label="添加标签"
            >
              <IconPlus size={22} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          className="mt-1 w-full rounded-[18px] border-0 bg-[#e8e0f5] py-3.5 text-[16px] font-bold text-know-ink"
        >
          保存
        </button>
      </PagePush>

      <BottomSheet
        open={open && pickCategory}
        onClose={cancelCategoryPicker}
        title="选择分类"
        zIndex={70}
        leading={
          <button
            type="button"
            onClick={cancelCategoryPicker}
            className="border-0 bg-transparent px-1 text-[15px] font-medium text-muted"
          >
            取消
          </button>
        }
        trailing={
          <button
            type="button"
            onClick={commitCategoryPicker}
            className="border-0 bg-transparent px-1 text-[15px] font-semibold text-know-ink"
          >
            确认
          </button>
        }
      >
        <div
          onClick={() => {
            if (markedCategory) setMarkedCategory(null);
          }}
        >
          <p className="mb-3 text-center text-[12px] text-muted">
            {markedCategory
              ? "点叉号删除 · 点其他处退出"
              : "点选后点确认保存 · 仅自定义分类可长按删除"}
          </p>
          <div className="mb-4 grid max-h-[260px] grid-cols-4 gap-2 overflow-x-hidden overflow-y-auto overscroll-contain px-1 pt-2">
            {categories.map((c) => (
              <div key={c} className="relative min-w-0">
                <button
                  type="button"
                  onPointerDown={() => startLongPress(c)}
                  onPointerUp={clearLongPress}
                  onPointerLeave={clearLongPress}
                  onPointerCancel={clearLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    clearLongPress();
                    if (markedCategory) {
                      setMarkedCategory(null);
                      return;
                    }
                    setCategoryDraft((prev) => {
                      const next = prev === c ? "" : c;
                      categoryDraftRef.current = next;
                      return next;
                    });
                  }}
                  className={`relative w-full select-none truncate rounded-[14px] border-0 px-1 py-2.5 text-center text-[13px] font-semibold ${
                    categoryDraft === c ? "bg-[#e8e0f5] text-know-ink" : "bg-cream-deep text-ink"
                  }`}
                >
                  {c}
                </button>
                {markedCategory === c ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      askDeleteCategory(c);
                    }}
                    className="absolute right-0 top-0 z-[1] flex h-5 w-5 -translate-y-1/3 translate-x-1/3 items-center justify-center rounded-full border-0 bg-[#3d3429] p-0 text-white"
                    aria-label={`删除 ${c}`}
                  >
                    <IconClose size={11} stroke="#fff" className="block shrink-0" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomCategory();
                }
              }}
              maxLength={12}
              placeholder="自定义分类"
              className="min-w-0 flex-1 rounded-[14px] border-0 bg-cream-deep px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={addCustomCategory}
              className="shrink-0 rounded-[14px] border-0 bg-[#e8e0f5] px-4 text-[14px] font-semibold text-know-ink"
            >
              添加
            </button>
          </div>
        </div>
      </BottomSheet>

      {deletingCategory ? (
        <div
          className="absolute inset-0 flex items-center justify-center px-8"
          style={{ zIndex: 80 }}
        >
          <button
            type="button"
            className="absolute inset-0 border-0 bg-black/35"
            aria-label="关闭"
            onClick={exitMarkMode}
          />
          <div
            className="relative z-10 w-full max-w-[320px] rounded-[22px] bg-white px-5 pb-5 pt-6 shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
            role="dialog"
            aria-modal="true"
            aria-label="删除分类"
          >
            <p className="mb-5 text-center text-[16px] font-semibold leading-relaxed text-ink">
              确定删除分类「{deletingCategory}」？
            </p>
            <p className="mb-5 text-center text-[13px] leading-relaxed text-muted">
              该分类下的知识会归到「未分类」。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={exitMarkMode}
                className="flex-1 rounded-[14px] border-0 bg-[#f2f1ef] py-3 text-[15px] font-semibold text-ink"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="flex-1 rounded-[14px] border-0 bg-[#d25c5c] py-3 text-[15px] font-semibold text-white"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function LifeSheet({
  open,
  onClose,
  catalog,
  onAdd,
  showToast,
}: {
  open: boolean;
  onClose: () => void;
  catalog: { id: string; name: string; icon: string }[];
  onAdd: (name: string, minutes: number, icon?: string, note?: string, startHm?: string) => void;
  showToast: (msg: string) => void;
}) {
  const card = "card-border rounded-[22px] bg-white px-4 py-3.5";
  const sectionTitle = "text-[16px] font-bold text-ink";

  const [picked, setPicked] = useState("");
  const [minutes, setMinutes] = useState(40);
  const [preset, setPreset] = useState<"15" | "30" | "60" | "custom">("custom");
  const [customDraft, setCustomDraft] = useState("40");
  const [note, setNote] = useState("");
  const [startHm, setStartHm] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [timeOpen, setTimeOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const d = new Date();
    setStartHm(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    setPicked("");
    setMinutes(40);
    setPreset("custom");
    setCustomDraft("40");
    setNote("");
    setTimeOpen(false);
    // 只在打开时初始化，避免父组件重渲染把页面状态冲掉
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const icon = catalog.find((c) => c.name === picked)?.icon || "";

  const endHm = useMemo(() => {
    const [h, m] = startHm.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return "--:--";
    const total = h * 60 + m + Math.max(0, minutes);
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  }, [startHm, minutes]);

  const applyPreset = (p: "15" | "30" | "60" | "custom") => {
    setPreset(p);
    if (p === "15") setMinutes(15);
    else if (p === "30") setMinutes(30);
    else if (p === "60") setMinutes(60);
    else {
      const n = Number(customDraft);
      if (Number.isFinite(n) && n > 0) setMinutes(Math.round(n));
    }
  };

  const submit = () => {
    if (!picked) {
      showToast("选择一个活动吧");
      return;
    }
    const mins = Math.max(1, Math.round(minutes));
    if (!Number.isFinite(mins) || mins <= 0) {
      showToast("填一下时长");
      return;
    }
    onAdd(picked, mins, icon, note.trim() || undefined, startHm);
    onClose();
  };

  const activities = catalog.length ? catalog : [
    { id: "read", name: "阅读", icon: "📖" },
    { id: "study", name: "学习", icon: "📚" },
    { id: "work", name: "工作", icon: "💼" },
    { id: "sport", name: "运动", icon: "🏓" },
    { id: "cook", name: "做饭", icon: "🍳" },
    { id: "walk", name: "散步", icon: "🎧" },
    { id: "play", name: "娱乐", icon: "🎬" },
    { id: "other", name: "其他", icon: "···" },
  ];

  return (
    <>
    <PagePush
      open={open}
      onClose={onClose}
      title="记时间"
      layout="bar"
    >
      <FishPageHero
        title="时间都去哪了～去哪了～"
        sub="记录一下今天的生活吧。"
        fishSrc="/icons/page-fish-life.png?v=1"
        bubbleTight
      />
      <section className={`mb-3.5 ${card}`}>
        <h2 className={`mb-3 ${sectionTitle}`}>活动</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {activities.map((c) => {
            const active = picked === c.name;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setPicked(c.name)}
                className={`flex flex-col items-center gap-1.5 rounded-[18px] border-2 px-1 py-3 ${
                  active
                    ? "border-transparent bg-life text-life-ink"
                    : "border-transparent bg-cream-deep text-ink"
                }`}
              >
                <span className="text-[22px] leading-none">{lifeEmoji(c.name, c.icon)}</span>
                <span className="text-[12px] font-medium">{c.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`mb-3.5 ${card}`}>
        <button
          type="button"
          onClick={() => setTimeOpen(true)}
          className="flex w-full items-center justify-between border-0 bg-transparent py-1 text-left"
        >
          <span className="text-[15px] font-medium text-ink">开始时间</span>
          <span className="flex items-center gap-0.5 text-[14px] text-muted">
            今天 {startHm}
            <IconChevron size={14} className="mr-0.5" />
          </span>
        </button>

        <div className="my-3 h-px bg-line" />

        <div>
          <span className={`mb-2 block ${sectionTitle}`}>时长</span>
          <div className="mb-3 flex items-end justify-between gap-3">
            <p className="text-[28px] font-bold leading-none text-ink">
              {minutes}
              <span className="ml-1 text-[16px] font-semibold">分钟</span>
            </p>
            <p className="pb-0.5 text-[13px] text-muted">结束 {endHm}</p>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-2">
            {(
              [
                ["15", "15分钟"],
                ["30", "30分钟"],
                ["60", "1小时"],
                ["custom", "自定义"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`rounded-full border-0 px-1 py-2 text-[12px] font-medium ${
                  preset === key ? "bg-life text-life-ink" : "bg-cream-deep text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {preset === "custom" ? (
            <input
              value={customDraft}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                setCustomDraft(v);
                const n = Number(v);
                if (Number.isFinite(n) && n > 0) setMinutes(n);
              }}
              inputMode="numeric"
              placeholder="输入分钟数"
              className="mb-3 w-full rounded-[12px] border-0 bg-cream-deep px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted"
            />
          ) : null}
        </div>

        <div className="my-1 h-px bg-line" />

        <label className="mt-3 block">
          <span className={`mb-1.5 block ${sectionTitle}`}>备注 (可选)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            rows={3}
            maxLength={200}
            placeholder="记录一下这段时间的感受..."
            className="w-full resize-none border-0 bg-transparent py-1 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted"
          />
        </label>
      </section>

      <button
        type="button"
        onClick={submit}
        className="mt-1 w-full rounded-[18px] border-0 bg-life py-3.5 text-[16px] font-bold text-life-ink"
      >
        保存
      </button>
    </PagePush>

      <TimePickerModal
        open={timeOpen}
        value={startHm}
        onCancel={() => setTimeOpen(false)}
        onConfirm={(hm) => {
          setStartHm(hm);
          setTimeOpen(false);
        }}
      />
    </>
  );
}

function SpendSheet({
  open,
  onClose,
  onSave,
  showToast,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: {
    amount: number;
    category: string;
    note?: string;
    payment?: string;
    date?: string;
  }) => void;
  showToast: (msg: string) => void;
}) {
  const { showFishDanmaku, data } = useApp();
  const fishName = resolveFishName(data.settings.fishName);
  const card = "card-border rounded-[22px] bg-white px-4 py-3.5";
  const sectionTitle = "text-[16px] font-bold text-ink";

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<string>(PAYMENT_METHODS[0]);
  const [date, setDate] = useState(todayKey());
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setDateOpen(false);
      return;
    }
    setAmount("");
    setCategory("");
    setNote("");
    setPayment(PAYMENT_METHODS[0]);
    setDate(todayKey());
    setDateOpen(false);
  }, [open]);

  const dateLabel = useMemo(() => {
    if (date === todayKey()) {
      const [, m, d] = date.split("-");
      return `今天 ${Number(m)}月${Number(d)}日`;
    }
    return formatCN(date);
  }, [date]);

  const submit = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      showToast("填一下金额");
      return;
    }
    if (!category) {
      showToast("选择一个分类吧");
      return;
    }
    onSave({
      amount: n,
      category,
      note: note.trim() || undefined,
      payment,
      date: date > todayKey() ? todayKey() : date,
    });
  };

  return (
    <>
    <PagePush
      open={open}
      onClose={onClose}
      title="记花费"
      layout="bar"
    >
      <FishPageHero
        title="买到了什么好东西呀？"
        sub={`${fishName}会帮你记住！`}
        fishSrc="/icons/page-fish-spend.png?v=9"
        bubbleTight
      />
      <section className={`mb-3.5 ${card}`}>
        <span className={`mb-2 block ${sectionTitle}`}>金额</span>
        <div className="flex min-h-[44px] items-center gap-2 overflow-visible">
          <span className="shrink-0 text-[22px] font-bold leading-none text-ink">¥</span>
          <input
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.]/g, "");
              const parts = v.split(".");
              const cleaned =
                parts.length > 2
                  ? `${parts[0]}.${parts.slice(1).join("")}`
                  : v;
              setAmount(cleaned.slice(0, 10));
            }}
            inputMode="decimal"
            placeholder="0.00"
            className="h-11 w-full border-0 bg-transparent text-[32px] font-bold leading-[44px] text-ink outline-none placeholder:text-muted"
          />
        </div>

        <div className="my-3.5 h-px bg-line" />

        <h2 className={`mb-3 ${sectionTitle}`}>分类</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {EXPENSE_CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex flex-col items-center gap-1.5 rounded-[18px] border-2 px-1 py-3 ${
                  active
                    ? "border-transparent bg-spend text-spend-ink"
                    : "border-transparent bg-cream-deep text-ink"
                }`}
              >
                <span className="text-[22px] leading-none">{spendEmoji(c)}</span>
                <span className="text-[12px] font-medium">{c}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`mb-3.5 ${card}`}>
        <label className="block">
          <span className={`mb-1.5 block ${sectionTitle}`}>备注</span>
          <div className="flex items-center gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 40))}
              maxLength={40}
              placeholder="买了什么？"
              className="min-w-0 flex-1 border-0 bg-transparent py-1 text-[15px] text-ink outline-none placeholder:text-muted"
            />
            {note ? (
              <button
                type="button"
                onClick={() => setNote("")}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-0 bg-cream-deep text-[12px] text-muted"
                aria-label="清空备注"
              >
                ×
              </button>
            ) : null}
          </div>
        </label>

        <div className="my-3 h-px bg-line" />

        <button
          type="button"
          onClick={() => setDateOpen(true)}
          className="flex w-full items-center justify-between border-0 bg-transparent py-1 text-left"
        >
          <span className={sectionTitle}>日期</span>
          <span className="flex items-center gap-0.5 text-[14px] text-muted">
            {dateLabel}
            <IconChevron size={14} className="mr-0.5" />
          </span>
        </button>

        <div className="my-3 h-px bg-line" />

        <span className={`mb-2 block ${sectionTitle}`}>支付方式 (可选)</span>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPayment(p)}
              className={`rounded-full border-0 px-1 py-2 text-[12px] font-medium ${
                payment === p ? "bg-spend text-spend-ink" : "bg-cream-deep text-ink"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={submit}
        className="mt-1 w-full rounded-[18px] border-0 bg-[#f3c77a] py-3.5 text-[16px] font-bold text-ink"
      >
        保存
      </button>
    </PagePush>

      <DatePickerModal
        open={dateOpen}
        value={date}
        maxDate={todayKey()}
        onCancel={() => setDateOpen(false)}
        onBlocked={() => showFishDanmaku("时间还没到呢", 1600)}
        confirmClassName="text-fish-deep"
        onConfirm={(ymd) => {
          setDate(ymd > todayKey() ? todayKey() : ymd);
          setDateOpen(false);
        }}
      />
    </>
  );
}

const NOTE_MOODS = [
  { id: "happy", label: "开心", emoji: "😊" },
  { id: "calm", label: "平静", emoji: "😌" },
  { id: "tired", label: "疲惫", emoji: "😮‍💨" },
  { id: "lost", label: "迷茫", emoji: "😕" },
  { id: "sad", label: "难过", emoji: "😢" },
  { id: "hope", label: "满怀希望", emoji: "✨" },
  { id: "excited", label: "兴奋", emoji: "🤩" },
  { id: "grateful", label: "幸福", emoji: "🥰" },
  { id: "anxious", label: "焦虑", emoji: "😰" },
  { id: "angry", label: "生气", emoji: "😠" },
  { id: "lonely", label: "孤单", emoji: "🥺" },
  { id: "peaceful", label: "安心", emoji: "☺️" },
] as const;

const NOTE_WEATHERS = [
  { id: "sun", label: "晴", emoji: "☀️" },
  { id: "cloud", label: "多云", emoji: "⛅" },
  { id: "rain", label: "雨", emoji: "🌧️" },
  { id: "thunder", label: "雷", emoji: "⛈️" },
  { id: "snow", label: "雪", emoji: "❄️" },
  { id: "other", label: "其他", emoji: "🌈" },
] as const;

const NOTE_MAX_LEN = 1000;
const NOTE_PAGE_SIZE = 6;

function chunkOptions<T>(list: readonly T[], size: number) {
  const pages: T[][] = [];
  for (let i = 0; i < list.length; i += size) pages.push([...list.slice(i, i + size)]);
  return pages;
}

function OptionSwipePager({
  items,
  value,
  onChange,
  activeClass,
}: {
  items: readonly { id: string; label: string; emoji: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
  activeClass: string;
}) {
  const pages = useMemo(() => chunkOptions(items, NOTE_PAGE_SIZE), [items]);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const swiping = useRef(false);
  const suppressClick = useRef(false);
  const pageRef = useRef(0);
  const [page, setPage] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [busy, setBusy] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    if (!value) return;
    const idx = items.findIndex((item) => item.id === value);
    if (idx < 0) return;
    setPage(Math.floor(idx / NOTE_PAGE_SIZE));
  }, [value, items]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (pages.length <= 1) return;
    tracking.current = true;
    swiping.current = false;
    suppressClick.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setBusy(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!tracking.current || !width) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!swiping.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        tracking.current = false;
        setBusy(false);
        setDragX(0);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }
      swiping.current = true;
      suppressClick.current = true;
    }
    const atStart = pageRef.current <= 0 && dx > 0;
    const atEnd = pageRef.current >= pages.length - 1 && dx < 0;
    setDragX(atStart || atEnd ? dx * 0.35 : dx);
  };

  const endPointer = (e: PointerEvent<HTMLDivElement>) => {
    if (!tracking.current) return;
    tracking.current = false;
    setBusy(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!swiping.current) {
      setDragX(0);
      return;
    }
    const dx = e.clientX - startX.current;
    let next = pageRef.current;
    if (dx < -width * 0.2 || dx < -48) next = Math.min(pages.length - 1, next + 1);
    else if (dx > width * 0.2 || dx > 48) next = Math.max(0, next - 1);
    setPage(next);
    setDragX(0);
    swiping.current = false;
  };

  const offset = width ? -page * width + dragX : dragX;

  return (
    <div ref={trackRef} className="overflow-hidden touch-pan-y">
      <div
          className={`flex ${busy ? "" : "transition-transform duration-200 ease-out"}`}
        style={{
          width: width ? width * pages.length : "100%",
          transform: `translateX(${offset}px)`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        {pages.map((group, gi) => (
          <div
            key={gi}
            className="grid shrink-0 grid-cols-6 gap-1"
            style={{ width: width || "100%" }}
          >
            {group.map((item) => {
              const active = value === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      return;
                    }
                    onChange(active ? null : item.id);
                  }}
                  className={`flex flex-col items-center gap-1 rounded-[14px] border-0 px-0.5 py-2 ${
                    active ? activeClass : "bg-transparent text-ink"
                  }`}
                >
                  <span className="text-[22px] leading-none">{item.emoji}</span>
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {pages.length > 1 ? (
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === page ? "w-3 bg-note-ink/50" : "w-1.5 bg-[#e5e0d8]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NoteSheet({
  open,
  onClose,
  date: dateValue,
  dateLocked = false,
  days,
  onSave,
  showToast,
  showFishHero = false,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  /** 从日志记录进入编辑时不可改日期 */
  dateLocked?: boolean;
  days: Record<string, Day>;
  onSave: (
    headline: string,
    body: string,
    date: string,
    mood: string | null,
    weather: string | null
  ) => void;
  showToast: (msg: string) => void;
  showFishHero?: boolean;
}) {
  const { showFishDanmaku, calendarDay } = useApp();
  const card = "card-border rounded-[22px] bg-white px-4 py-3.5";
  const sectionTitle = "text-[16px] font-bold text-ink";
  const HEADLINE_MAX = 18;
  const today = calendarDay;

  const [date, setDate] = useState(dateValue);
  const [dateOpen, setDateOpen] = useState(false);
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [weather, setWeather] = useState<string | null>(null);

  const loadDayNote = (ymd: string) => {
    const day = days[ymd];
    const sn = (day?.shortNote || "").trim();
    const jn = (day?.journal || "").trim();
    if (jn) {
      setHeadline(sn.slice(0, HEADLINE_MAX));
      setBody(jn.slice(0, NOTE_MAX_LEN));
    } else if (sn.length > HEADLINE_MAX) {
      const m = sn.match(/^(.{1,18}?)([。！？\n]|$)/);
      const title = (m?.[1] || sn.slice(0, HEADLINE_MAX)).slice(0, HEADLINE_MAX);
      setHeadline(title);
      const after = sn.slice(title.length).replace(/^[。！？\n\s]+/, "").trim();
      setBody(after.slice(0, NOTE_MAX_LEN));
    } else {
      setHeadline(sn);
      setBody("");
    }
    setMood(day?.mood?.trim() || null);
    setWeather(day?.weather?.trim() || null);
  };

  const dayHasNote = (ymd: string) => {
    const day = days[ymd];
    return !!(day?.shortNote?.trim() || day?.journal?.trim());
  };

  useEffect(() => {
    if (!open) {
      setDateOpen(false);
      setOverwriteOpen(false);
      return;
    }
    setDate(dateValue);
    setOverwriteOpen(false);
    if (dateLocked) {
      loadDayNote(dateValue);
    } else {
      // 加号新建：每次打开空白表单，改已有内容请从日志记录进入
      setHeadline("");
      setBody("");
      setMood(null);
      setWeather(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when sheet opens / target date changes
  }, [open, dateValue, dateLocked]);

  const dateLabel = useMemo(() => {
    if (date === today) {
      const [, m, d] = date.split("-");
      return `今天 ${Number(m)}月${Number(d)}日`;
    }
    return formatCN(date);
  }, [date, today]);

  const doSave = () => {
    setOverwriteOpen(false);
    onSave(headline.trim(), body.trim(), date, mood, weather);
  };

  const submit = () => {
    if (!headline.trim() && body.trim()) {
      showToast("先写一句吧");
      return;
    }
    // 加号新建且该日已有日志：先确认再覆盖；从记录进入编辑则直接保存
    if (!dateLocked && dayHasNote(date)) {
      setOverwriteOpen(true);
      return;
    }
    doSave();
  };

  return (
    <>
    <PagePush
      open={open}
      onClose={onClose}
      title="写一句"
      layout="bar"
      zIndex={50}
    >
      {showFishHero ? (
        <FishPageHero
          title="要和我说点悄悄话嘛！"
          sub="今天是怎样的一天呢～"
          fishSrc="/icons/page-fish-journal.png?v=2"
          bubbleTighter
          fishInset
          fishDown
          nudgeUp
        />
      ) : null}

      {dateLocked ? (
        <section className={`mb-3.5 ${card}`}>
          <div className="flex min-h-[28px] w-full items-center justify-between">
            <span className={sectionTitle}>日期</span>
            <span className="text-[14px] text-muted">{dateLabel}</span>
          </div>
        </section>
      ) : (
        <section className={`mb-3.5 ${card}`}>
          <button
            type="button"
            onClick={() => setDateOpen(true)}
            className="flex min-h-[28px] w-full items-center justify-between border-0 bg-transparent p-0 text-left"
          >
            <span className={sectionTitle}>日期</span>
            <span className="flex items-center gap-0.5 text-[14px] text-muted">
              {dateLabel}
              <IconChevron size={14} className="mr-0.5" />
            </span>
          </button>
        </section>
      )}

      <section className={`mb-3.5 ${card}`}>
        <span className={`mb-1.5 block ${sectionTitle}`}>第一句</span>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value.slice(0, HEADLINE_MAX))}
          maxLength={HEADLINE_MAX}
          placeholder="这一句会出现在我的日志里"
          className="w-full border-0 bg-transparent py-1 text-[15px] text-ink outline-none placeholder:text-muted"
        />
        <div className="mt-1 flex items-center justify-end">
          <span className="text-[12px] text-muted">
            {headline.length}/{HEADLINE_MAX}
          </span>
        </div>
      </section>

      <section className={`mb-3.5 ${card}`}>
        <span className={`mb-1.5 block ${sectionTitle}`}>日志 (选填)</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, NOTE_MAX_LEN))}
          maxLength={NOTE_MAX_LEN}
          rows={6}
          placeholder="想写多一点也可以，慢慢记…"
          className="w-full resize-none border-0 bg-transparent py-1 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted"
        />
        <div className="mt-1 flex items-center justify-end">
          <span className="text-[12px] text-muted">
            {body.length}/{NOTE_MAX_LEN}
          </span>
        </div>
      </section>

      <section className={`mb-3.5 ${card}`}>
        <span className={`mb-2.5 block ${sectionTitle}`}>心情 (可选)</span>
        <OptionSwipePager
          items={NOTE_MOODS}
          value={mood}
          onChange={setMood}
          activeClass="bg-note text-note-ink"
        />

        <div className="my-3 h-px bg-line" />

        <span className={`mb-2.5 block ${sectionTitle}`}>天气 (可选)</span>
        <OptionSwipePager
          items={NOTE_WEATHERS}
          value={weather}
          onChange={setWeather}
          activeClass="bg-note text-note-ink"
        />
      </section>

      <button
        type="button"
        onClick={submit}
        className="mt-1 w-full rounded-[18px] border-0 bg-[#f0c4c0] py-3.5 text-[16px] font-bold text-note-ink"
      >
        保存
      </button>
    </PagePush>

    <DatePickerModal
      open={dateOpen}
      value={date}
      maxDate={today}
      confirmClassName="text-[#e0a09a]"
      onCancel={() => setDateOpen(false)}
      onBlocked={() => showFishDanmaku("时间还没到呢", 1600)}
      onConfirm={(ymd) => {
        setDate(ymd > today ? today : ymd);
        setDateOpen(false);
      }}
    />

    {overwriteOpen ? (
      <div
        className="absolute inset-0 z-[70] flex items-center justify-center px-10"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="absolute inset-0 border-0 bg-black/30"
          aria-label="关闭"
          onClick={() => setOverwriteOpen(false)}
        />
        <div className="relative z-[1] w-full max-w-[300px] rounded-[22px] bg-white px-5 pb-5 pt-6 shadow-[0_16px_40px_rgba(60,50,30,0.18)]">
          <p className="mb-5 text-center text-[18px] font-bold leading-snug text-ink">
            确认替换已保存的内容？
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setOverwriteOpen(false)}
              className="flex-1 rounded-[14px] border-0 bg-cream-deep py-3 text-[15px] font-medium text-muted"
            >
              取消
            </button>
            <button
              type="button"
              onClick={doSave}
              className="flex-1 rounded-[14px] border-0 bg-[#f0c4c0] py-3 text-[15px] font-semibold text-note-ink"
            >
              替换
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}

function HighlightSheet({
  open,
  onClose,
  value,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => {
    if (open) setText(value);
  }, [open, value]);
  return (
    <BottomSheet open={open} onClose={onClose} title="今天的高光瞬间">
      <p className="mb-3 text-[13px] text-muted">值得以后回来看看的那一件事。</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={80}
        rows={3}
        placeholder="例如：第一次做饭成功"
        className="mb-4 w-full resize-none rounded-[16px] border-0 bg-cream px-3 py-3 outline-none"
      />
      <div className="flex gap-2">
        <GhostButton onClick={onClose}>取消</GhostButton>
        <PrimaryButton
          onClick={() => {
            if (!text.trim()) return;
            onSave(text.trim());
          }}
        >
          留下高光
        </PrimaryButton>
      </div>
    </BottomSheet>
  );
}

function SectionTitle({
  title,
  count,
  className = "mb-2 px-0.5",
}: {
  title: string;
  count?: string;
  className?: string;
}) {
  return (
    <h3 className={`${className} text-[16px] font-extrabold text-ink`}>
      {title}
      {count ? <span className="font-semibold text-muted"> · {count}</span> : null}
    </h3>
  );
}

function DayJournalSection({
  day: d,
  date,
  className = "mb-5",
  active = true,
}: {
  day: Day;
  date: string;
  className?: string;
  active?: boolean;
}) {
  const { openDayNote, clearDayNotes, setJournalIndent } = useApp();
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(false);
  const [journalIndentOpen, setJournalIndentOpen] = useState(false);
  const journalIndentWrapRef = useRef<HTMLDivElement>(null);
  const journalIndentFirst = d.journalIndent === "indent";

  useEffect(() => {
    if (!active) {
      setConfirmDeleteNote(false);
      setJournalIndentOpen(false);
    }
  }, [active]);

  useEffect(() => {
    if (!journalIndentOpen) return;
    const onPointer = (e: Event) => {
      if (!journalIndentWrapRef.current?.contains(e.target as Node)) {
        setJournalIndentOpen(false);
      }
    };
    // capture：避免被页面其它手势/冒泡拦住
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("mousedown", onPointer, true);
    document.addEventListener("touchstart", onPointer, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("mousedown", onPointer, true);
      document.removeEventListener("touchstart", onPointer, true);
    };
  }, [journalIndentOpen]);

  if (!(d.shortNote.trim() || d.journal.trim())) {
    return null;
  }

  const indentMenu = journalIndentOpen ? (
    <div className="absolute right-0 top-9 z-20 w-[132px] overflow-hidden rounded-[14px] bg-white py-1.5 shadow-[0_10px_28px_rgba(60,50,30,0.14)]">
      {(
        [
          { id: "indent" as const, label: "首行缩进" },
          { id: "flush" as const, label: "顶格" },
        ] as const
      ).map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => {
            setJournalIndent(date, opt.id);
            setJournalIndentOpen(false);
          }}
          className={`flex w-full border-0 bg-transparent px-3.5 py-2.5 text-left text-[14px] ${
            (opt.id === "indent" ? journalIndentFirst : !journalIndentFirst)
              ? "font-semibold text-ink"
              : "font-normal text-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ) : null;

  const indentButton = d.journal.trim() ? (
    <button
      type="button"
      aria-label="正文排版"
      aria-expanded={journalIndentOpen}
      onClick={() => setJournalIndentOpen((v) => !v)}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-muted"
    >
      <IconChevron
        size={14}
        className={`transition-transform ${journalIndentOpen ? "-rotate-90" : "rotate-90"}`}
      />
    </button>
  ) : null;

  return (
    <>
      <section className={className}>
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h3 className="text-[16px] font-extrabold text-ink">日志</h3>
          {d.shortNote.trim() || d.journal.trim() ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => openDayNote(date)}
                className="border-0 bg-transparent p-0 text-[13px] font-medium text-note-ink"
              >
                修改
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteNote(true)}
                className="border-0 bg-transparent p-0 text-[13px] font-medium text-note-ink"
              >
                删除
              </button>
            </div>
          ) : null}
        </div>
        <div className="rounded-[18px] border border-[#ebe4da] bg-white px-4 pb-4 pt-5">
          {d.shortNote.trim() || d.journal.trim() ? (
            <div className="space-y-3.5">
              {d.shortNote.trim() && d.journal.trim() ? (
                <div
                  className="relative flex items-start justify-between gap-2"
                  ref={journalIndentWrapRef}
                >
                  <p className="min-w-0 flex-1 text-[17px] font-bold leading-snug text-ink">
                    {d.shortNote}
                  </p>
                  {indentButton}
                  {indentMenu}
                </div>
              ) : d.shortNote.trim() ? (
                <p className="text-[17px] font-bold leading-snug text-ink">{d.shortNote}</p>
              ) : null}
              {d.journal.trim() ? (
                <>
                  {!d.shortNote.trim() ? (
                    <div className="relative flex items-center justify-end" ref={journalIndentWrapRef}>
                      {indentButton}
                      {indentMenu}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1.5" aria-hidden>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F0C96A]" />
                    <span className="h-[3px] w-9 rounded-full bg-[#FFE7A8]" />
                  </div>
                  <div>
                    {d.journal.split("\n").map((line, i) =>
                      line.length === 0 ? (
                        <div key={`gap-${i}`} aria-hidden className="h-4" />
                      ) : (
                        <p
                          key={`line-${i}`}
                          className="font-kai m-0 text-[16px] leading-[1.9] tracking-[0.015em] text-[#3F3B36]"
                          style={{ textIndent: journalIndentFirst ? "2em" : 0 }}
                        >
                          {line}
                        </p>
                      )
                    )}
                  </div>
                </>
              ) : null}
              {d.mood || d.weather ? (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {NOTE_MOODS.find((m) => m.id === d.mood) ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-note px-2.5 py-1 text-[13px] text-note-ink">
                      <span aria-hidden>{NOTE_MOODS.find((m) => m.id === d.mood)!.emoji}</span>
                      {NOTE_MOODS.find((m) => m.id === d.mood)!.label}
                    </span>
                  ) : null}
                  {NOTE_WEATHERS.find((w) => w.id === d.weather) ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF3D9] px-2.5 py-1 text-[13px] text-[#9A7040]">
                      <span aria-hidden>{NOTE_WEATHERS.find((w) => w.id === d.weather)!.emoji}</span>
                      {NOTE_WEATHERS.find((w) => w.id === d.weather)!.label}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {confirmDeleteNote ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-10"
          role="dialog"
          aria-modal="true"
          aria-label="删除日志"
        >
          <button
            type="button"
            className="absolute inset-0 border-0 bg-black/30"
            aria-label="关闭"
            onClick={() => setConfirmDeleteNote(false)}
          />
          <div className="relative z-[1] w-full max-w-[300px] rounded-[22px] bg-white px-5 pb-5 pt-6 shadow-[0_16px_40px_rgba(60,50,30,0.18)]">
            <h2 className="mb-2 text-center text-[18px] font-bold text-ink">删除日志？</h2>
            <p className="mb-5 text-center text-[13px] leading-relaxed text-muted">
              将清除这一天的短记和日志正文，删除后无法恢复。
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteNote(false)}
                className="flex-1 rounded-[14px] border-0 bg-cream-deep py-3 text-[15px] font-medium text-muted"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDayNotes(date);
                  setConfirmDeleteNote(false);
                }}
                className="flex-1 rounded-[14px] border-0 bg-[#E07070] py-3 text-[15px] font-semibold text-white"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function HarvestPage({
  open,
  onClose,
  day,
  focus = "all",
}: {
  open: boolean;
  onClose: () => void;
  day: Day;
  focus?: "all" | "knowledge" | "life" | "spend";
}) {
  const { deleteKnowledge, deleteLife, deleteExpense, openKnowledge } = useApp();
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const interactive = focus !== "all";

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!open) {
      setOpenSwipeId(null);
      setExpandedIds(new Set());
    }
  }, [open]);

  useEffect(() => {
    if (!openSwipeId) return;
    const onDown = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("[data-swipe-delete]")) return;
      if (t.closest(`[data-swipe-item="${openSwipeId}"]`)) return;
      setOpenSwipeId(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openSwipeId]);

  const lifeRows = [...day.life]
    .filter((l) => l.minutes > 0)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const lifeTotal = lifeRows.reduce((s, x) => s + x.minutes, 0);
  const knowledge = [...day.knowledge].sort((a, b) => a.createdAt - b.createdAt);
  const expenses = [...day.expenses].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const spendTotal = expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const showAll = focus === "all";
  const showLife = showAll || focus === "life";
  const showKnow = showAll || focus === "knowledge";
  const showSpend = showAll || focus === "spend";
  const title =
    focus === "knowledge"
      ? "今日知识"
      : focus === "life"
        ? "今日生活"
        : focus === "spend"
          ? "今日花费"
          : "今天的小收获";

  return (
    <PagePush open={open} onClose={onClose} title={title} layout="bar">
      {showAll ? (
        <p className="mb-4 px-0.5 text-[14px] text-muted">{formatCN(day.date)}</p>
      ) : null}

      {showAll ? (
        <DayJournalSection day={day} date={day.date} className="mb-3.5" active={open} />
      ) : null}

      {showLife && (!showAll || lifeRows.length > 0) ? (
        <section className="mb-3.5">
          {showAll ? (
            <SectionTitle title="生活" count={lifeTotal ? formatMinutes(lifeTotal).replace(/\s/g, "") : undefined} />
          ) : null}
          <div className="grid gap-2">
            {lifeRows.length ? (
              lifeRows.map((l) => {
                const timeRange = lifeTimeRange(l.startHm, l.minutes);
                const note = l.note?.trim() || "";
                const canExpand = interactive && Boolean(timeRange || note);
                const body = (
                  <>
                    <span className="flex min-w-0 items-center gap-2.5 text-[14px] font-bold text-ink">
                      <span
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-cream-deep text-[18px]"
                        aria-hidden="true"
                      >
                        {lifeEmoji(l.name, l.icon)}
                      </span>
                      <span className="min-w-0 truncate">
                        <span className="block truncate">{l.name}</span>
                        {timeRange ? (
                          <span className="block truncate text-[12px] font-medium text-muted">
                            {timeRange}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-[14px] font-extrabold text-[#c9843d]">
                      {formatMinutes(l.minutes)}
                    </span>
                  </>
                );
                return (
                  <SwipeDeleteRow
                    key={l.id}
                    id={l.id}
                    open={openSwipeId === l.id}
                    onOpen={() => setOpenSwipeId(l.id)}
                    onClose={() => setOpenSwipeId((cur) => (cur === l.id ? null : cur))}
                    onDelete={() => {
                      deleteLife(l.id, day.date);
                      setOpenSwipeId(null);
                      setExpandedIds((prev) => {
                        if (!prev.has(l.id)) return prev;
                        const next = new Set(prev);
                        next.delete(l.id);
                        return next;
                      });
                    }}
                    className="rounded-[16px] bg-white border border-[#ebe4da]"
                  >
                    {canExpand ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(l.id)}
                        className="flex h-14 w-full items-center justify-between gap-3 border-0 bg-transparent px-3.5 text-left"
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="flex h-14 items-center justify-between gap-3 px-3.5">{body}</div>
                    )}
                    {canExpand && expandedIds.has(l.id) ? (
                      <div className="space-y-2 border-t border-line px-3.5 py-3 text-[13px] leading-relaxed text-muted">
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
                      </div>
                    ) : null}
                  </SwipeDeleteRow>
                );
              })
            ) : (
              <p className="px-1 py-2 text-[13px] text-muted">这天还没有时间记录</p>
            )}
          </div>
        </section>
      ) : null}

      {showKnow && (!showAll || knowledge.length > 0) ? (
        <section className="mb-3.5">
          {showAll ? (
            <SectionTitle
              title="知识"
              count={knowledge.length ? `${knowledge.length}条` : undefined}
            />
          ) : null}
          <div className="grid gap-2.5">
            {knowledge.length ? (
              knowledge.map((k) => {
                const [bg, color] = thumbPalette(k.category);
                const body = (
                  <>
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: bg, color }}
                    >
                      <ThumbFish />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                      {k.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {k.starred ? <IconStar size={14} stroke="#E8B24E" /> : null}
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: bg, color }}
                      >
                        {k.category}
                      </span>
                    </span>
                  </>
                );
                return (
                  <SwipeDeleteRow
                    key={k.id}
                    id={k.id}
                    open={openSwipeId === k.id}
                    onOpen={() => setOpenSwipeId(k.id)}
                    onClose={() => setOpenSwipeId((cur) => (cur === k.id ? null : cur))}
                    onDelete={() => {
                      deleteKnowledge(k.id, day.date);
                      setOpenSwipeId(null);
                    }}
                    className="rounded-[16px] bg-white border border-[#ebe4da]"
                  >
                    {interactive ? (
                      <button
                        type="button"
                        onClick={() => openKnowledge(k.id)}
                        className="flex h-14 w-full items-center gap-3 border-0 bg-transparent px-3.5 text-left"
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="flex h-14 items-center gap-3 px-3.5">{body}</div>
                    )}
                  </SwipeDeleteRow>
                );
              })
            ) : (
              <p className="px-1 py-2 text-[13px] text-muted">这天还没有知识记录</p>
            )}
          </div>
        </section>
      ) : null}

      {showSpend && (!showAll || expenses.length > 0) ? (
        <section className="mb-3.5">
          {showAll ? (
            <SectionTitle title="花费" count={spendTotal ? formatMoney(spendTotal) : undefined} />
          ) : null}
          <div className="grid gap-2.5">
            {expenses.length ? (
              expenses.map((e) => {
                const [bg] = thumbPalette(e.category);
                const body = (
                  <>
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[16px]"
                      style={{ background: bg }}
                      aria-hidden="true"
                    >
                      {spendEmoji(e.category)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                      {e.note || e.category}
                    </span>
                    <span className="whitespace-nowrap text-[14px] font-extrabold text-[#c9843d]">
                      {formatMoney(e.amount)}
                    </span>
                  </>
                );
                return (
                  <SwipeDeleteRow
                    key={e.id}
                    id={e.id}
                    open={openSwipeId === e.id}
                    onOpen={() => setOpenSwipeId(e.id)}
                    onClose={() => setOpenSwipeId((cur) => (cur === e.id ? null : cur))}
                    onDelete={() => {
                      deleteExpense(e.id, day.date);
                      setOpenSwipeId(null);
                      setExpandedIds((prev) => {
                        if (!prev.has(e.id)) return prev;
                        const next = new Set(prev);
                        next.delete(e.id);
                        return next;
                      });
                    }}
                    className="rounded-[16px] bg-white border border-[#ebe4da]"
                  >
                    {interactive ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(e.id)}
                        className="flex h-14 w-full items-center gap-3 border-0 bg-transparent px-3.5 text-left"
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="flex h-14 items-center gap-3 px-3.5">{body}</div>
                    )}
                    {interactive && expandedIds.has(e.id) ? (
                      <div className="space-y-2 border-t border-line px-3.5 py-3 text-[13px] leading-relaxed text-muted">
                        <p>
                          <span className="text-ink/70">分类</span> · {e.category}
                        </p>
                        {e.payment ? (
                          <p>
                            <span className="text-ink/70">支付</span> · {e.payment}
                          </p>
                        ) : null}
                        {e.note?.trim() ? (
                          <p>
                            <span className="text-ink/70">备注</span> · {e.note.trim()}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </SwipeDeleteRow>
                );
              })
            ) : (
              <p className="px-1 py-2 text-[13px] text-muted">这天还没有花费记录</p>
            )}
          </div>
        </section>
      ) : null}
    </PagePush>
  );
}

function DaySheet({
  open,
  onClose,
  day,
  date,
  focus = "all",
  onToggleHighlight,
  onOpenDetail,
}: {
  open: boolean;
  onClose: () => void;
  day: Day | null | undefined;
  date: string | null;
  focus?: "all" | "knowledge" | "life" | "spend" | "journal";
  onToggleHighlight: (date: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const { deleteKnowledge, deleteLife, deleteExpense } = useApp();
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!open) {
      setOpenSwipeId(null);
      setExpandedIds(new Set());
    }
  }, [open]);

  useEffect(() => {
    if (!openSwipeId) return;
    const onDown = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("[data-swipe-delete]")) return;
      if (t.closest(`[data-swipe-item="${openSwipeId}"]`)) return;
      setOpenSwipeId(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openSwipeId]);

  if (!date) return null;
  const d = day || {
    date,
    knowledge: [],
    life: [],
    expenses: [],
    shortNote: "",
    journal: "",
    journalIndent: "flush",
    mood: "",
    weather: "",
    highlight: false,
    highlightText: "",
    todos: [],
  };
  const lifeRows = [...d.life]
    .filter((l) => l.minutes > 0)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const lifeTotal = lifeRows.reduce((s, x) => s + x.minutes, 0);
  const knowledge = [...d.knowledge].sort((a, b) => a.createdAt - b.createdAt);
  const expenses = [...d.expenses].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const spendTotal = expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const showAll = focus === "all";
  const showJournal = showAll || focus === "journal";
  const showLife = showAll || focus === "life";
  const showKnow = showAll || focus === "knowledge";
  const showSpend = showAll || focus === "spend";
  const focusLabel =
    focus === "knowledge"
      ? "今日知识"
      : focus === "life"
        ? "今日生活"
        : focus === "spend"
          ? "今日花费"
          : null;
  const focusCount =
    focus === "knowledge"
      ? knowledge.length
        ? `${knowledge.length}条`
        : ""
      : focus === "life"
        ? lifeTotal
          ? formatMinutes(lifeTotal).replace(/\s/g, "")
          : ""
        : focus === "spend"
          ? spendTotal
            ? formatMoney(spendTotal)
            : ""
          : "";

  const dayEmpty =
    !d.shortNote.trim() &&
    !d.journal.trim() &&
    !d.highlight &&
    !d.highlightText.trim() &&
    knowledge.length === 0 &&
    lifeRows.length === 0 &&
    expenses.length === 0;
  const journalEmpty = !d.shortNote.trim() && !d.journal.trim();

  return (
    <PagePush
      open={open}
      onClose={onClose}
      title={formatCN(date)}
      layout="bar"
      zIndex={50}
      trailing={
        showAll || focus === "journal" ? (
          <button
            type="button"
            onClick={() => onToggleHighlight(date)}
            className="flex size-10 items-center justify-center rounded-full border-0 bg-transparent p-0 text-ink"
            aria-label="高光"
          >
            <IconStar
              size={17}
              stroke={d.highlight ? "#E8B24E" : "#C8C4BC"}
              className="block translate-y-[2px]"
            />
          </button>
        ) : undefined
      }
    >
      {focusLabel ? (
        <SectionTitle
          title={focusLabel}
          count={focusCount || undefined}
          className="mb-4"
        />
      ) : null}

      {showAll && dayEmpty ? (
        <p className="pt-6 text-center text-[14px] text-muted">这一天还没有记录</p>
      ) : null}

      {focus === "journal" && journalEmpty ? (
        <p className="pt-6 text-center text-[14px] text-muted">这一天还没有日志</p>
      ) : null}

      {showJournal ? <DayJournalSection day={d} date={date} active={open} /> : null}

      {showKnow && knowledge.length ? (
        <>
          {showAll ? (
            <SectionTitle
              title="知识"
              count={`${knowledge.length}条`}
              className="mb-2"
            />
          ) : null}
          <div className={`${showAll ? "mb-5" : ""} grid gap-2.5`}>
            {knowledge.map((k) => {
                const [bg, color] = thumbPalette(k.category);
                return (
                  <SwipeDeleteRow
                    key={k.id}
                    id={k.id}
                    open={openSwipeId === k.id}
                    onOpen={() => setOpenSwipeId(k.id)}
                    onClose={() => setOpenSwipeId((cur) => (cur === k.id ? null : cur))}
                    onDelete={() => {
                      deleteKnowledge(k.id, date);
                      setOpenSwipeId(null);
                    }}
                    className="rounded-[18px] bg-white border border-[#ebe4da]"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenDetail(k.id)}
                      className="flex h-14 w-full items-center gap-3 border-0 bg-transparent px-3.5 text-left"
                    >
                      <span
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                        style={{ background: bg, color }}
                      >
                        <ThumbFish />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                        {k.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {k.starred ? <IconStar size={14} stroke="#E8B24E" /> : null}
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: bg, color }}
                        >
                          {k.category}
                        </span>
                      </span>
                    </button>
                  </SwipeDeleteRow>
                );
              })}
          </div>
        </>
      ) : null}

      {showLife && lifeRows.length ? (
        <>
          {showAll ? (
            <SectionTitle
              title="生活"
              count={lifeTotal ? formatMinutes(lifeTotal).replace(/\s/g, "") : undefined}
              className="mb-2"
            />
          ) : null}
          <div className={`${showAll ? "mb-5" : ""} grid gap-2`}>
            {lifeRows.map((l) => {
                const timeRange = lifeTimeRange(l.startHm, l.minutes);
                const note = l.note?.trim() || "";
                const canExpand = Boolean(timeRange || note);
                return (
                  <SwipeDeleteRow
                    key={l.id}
                    id={l.id}
                    open={openSwipeId === l.id}
                    onOpen={() => setOpenSwipeId(l.id)}
                    onClose={() => setOpenSwipeId((cur) => (cur === l.id ? null : cur))}
                    onDelete={() => {
                      deleteLife(l.id, date);
                      setOpenSwipeId(null);
                      setExpandedIds((prev) => {
                        if (!prev.has(l.id)) return prev;
                        const next = new Set(prev);
                        next.delete(l.id);
                        return next;
                      });
                    }}
                    className="rounded-[16px] bg-white border border-[#ebe4da]"
                  >
                    {canExpand ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(l.id)}
                        className="flex h-14 w-full items-center justify-between gap-3 border-0 bg-transparent px-3.5 text-left"
                      >
                        <span className="flex min-w-0 items-center gap-2.5 text-[14px] font-bold text-ink">
                          <span
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-cream-deep text-[18px]"
                            aria-hidden="true"
                          >
                            {lifeEmoji(l.name, l.icon)}
                          </span>
                          <span className="min-w-0 truncate">
                            <span className="block truncate">{l.name}</span>
                            {timeRange ? (
                              <span className="block truncate text-[12px] font-medium text-muted">
                                {timeRange}
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <span className="whitespace-nowrap text-[14px] font-extrabold text-[#c9843d]">
                          {formatMinutes(l.minutes)}
                        </span>
                      </button>
                    ) : (
                      <div className="flex h-14 items-center justify-between gap-3 px-3.5">
                        <span className="flex min-w-0 items-center gap-2.5 text-[14px] font-bold text-ink">
                          <span
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-cream-deep text-[18px]"
                            aria-hidden="true"
                          >
                            {lifeEmoji(l.name, l.icon)}
                          </span>
                          <span className="min-w-0 truncate">
                            <span className="block truncate">{l.name}</span>
                          </span>
                        </span>
                        <span className="whitespace-nowrap text-[14px] font-extrabold text-[#c9843d]">
                          {formatMinutes(l.minutes)}
                        </span>
                      </div>
                    )}
                    {canExpand && expandedIds.has(l.id) ? (
                      <div className="space-y-2 border-t border-line px-3.5 py-3 text-[13px] leading-relaxed text-muted">
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
                      </div>
                    ) : null}
                  </SwipeDeleteRow>
                );
              })}
          </div>
        </>
      ) : null}

      {showSpend && expenses.length ? (
        <>
          {showAll ? (
            <SectionTitle
              title="花费"
              count={spendTotal ? formatMoney(spendTotal) : undefined}
              className="mb-2"
            />
          ) : null}
          <div className={`${showAll ? "mb-5" : ""} grid gap-2.5`}>
            {expenses.map((e) => {
                const [bg] = thumbPalette(e.category);
                return (
                  <SwipeDeleteRow
                    key={e.id}
                    id={e.id}
                    open={openSwipeId === e.id}
                    onOpen={() => setOpenSwipeId(e.id)}
                    onClose={() => setOpenSwipeId((cur) => (cur === e.id ? null : cur))}
                    onDelete={() => {
                      deleteExpense(e.id, date);
                      setOpenSwipeId(null);
                      setExpandedIds((prev) => {
                        if (!prev.has(e.id)) return prev;
                        const next = new Set(prev);
                        next.delete(e.id);
                        return next;
                      });
                    }}
                    className="rounded-[18px] bg-white border border-[#ebe4da]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(e.id)}
                      className="flex h-14 w-full items-center gap-3 border-0 bg-transparent px-3.5 text-left"
                    >
                      <span
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[16px]"
                        style={{ background: bg }}
                        aria-hidden="true"
                      >
                        {spendEmoji(e.category)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                        {e.note || e.category}
                      </span>
                      <span className="whitespace-nowrap text-[14px] font-extrabold text-[#c9843d]">
                        {formatMoney(e.amount)}
                      </span>
                    </button>
                    {expandedIds.has(e.id) ? (
                      <div className="space-y-2 border-t border-line px-3.5 py-3 text-[13px] leading-relaxed text-muted">
                        <p>
                          <span className="text-ink/70">分类</span> · {e.category}
                        </p>
                        {e.payment ? (
                          <p>
                            <span className="text-ink/70">支付</span> · {e.payment}
                          </p>
                        ) : null}
                        {e.note?.trim() ? (
                          <p>
                            <span className="text-ink/70">备注</span> · {e.note.trim()}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </SwipeDeleteRow>
                );
              })}
          </div>
        </>
      ) : null}
    </PagePush>
  );
}

const LIFE_EMOJI: Record<string, string> = {
  锻炼: "💪",
  运动: "🏓",
  看书: "📖",
  阅读: "📖",
  学习: "📚",
  工作: "💼",
  放下手机: "📵",
  散步: "🎧",
  走路散步: "🎧",
  做饭: "🍳",
  听播客: "🎧",
  写作手账: "✍️",
  冥想: "🧘",
  冥想放空: "🧘",
  练技能: "🎯",
  陪伴: "💞",
  线下见面: "☕",
  家务: "🧹",
  家务整理: "🧹",
  娱乐: "🎬",
  其他: "···",
  早睡准备: "🌙",
};

const SPEND_EMOJI: Record<string, string> = {
  餐饮: "🍜",
  交通: "🚌",
  购物: "🛍️",
  生活: "🏠",
  日用: "🧴",
  娱乐: "🎬",
  健康: "💊",
  社交: "☕",
  订阅: "📦",
  其他: "💰",
};

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

function lifeEmoji(name: string, icon?: string) {
  if (icon && !/^[a-z0-9_-]+$/i.test(icon)) return icon;
  return LIFE_EMOJI[name] || "·";
}

function spendEmoji(category: string) {
  return SPEND_EMOJI[category] || "💰";
}

function LootReviewPage({
  open,
  onClose,
  itemId,
  days,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string | null;
  days: Record<string, Day>;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);

  const dismiss = useCallback(() => {
    setMounted(false);
    onClose();
  }, [onClose]);

  const { panelRef, dragging, settling, dismissed } = useSwipeBack(
    dismiss,
    mounted && entered
  );

  const item = useMemo(() => {
    if (!itemId) return null;
    for (const day of Object.values(days)) {
      const k = day.knowledge.find((x) => x.id === itemId);
      if (k) return { title: k.title, category: k.category, date: day.date };
    }
    return null;
  }, [days, itemId]);

  const tone = categoryTone(item?.category || "");

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
    setMounted(false);
  }, [open]);

  if (!mounted) return null;

  const goReview = () => {
    setMounted(false);
    onConfirm();
  };

  return (
    <div
      ref={panelRef}
      className={`absolute inset-0 z-[55] ${dragging ? "page-push-dragging" : ""} ${
        settling ? "page-push-settling" : ""
      } ${dismissed ? "pointer-events-none" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="随机复习"
    >
      <div
        className={`loot-scrim pointer-events-none transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
      <button
        type="button"
        onClick={dismiss}
        className={`absolute left-3 z-[2] flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-ink safe-header-pt transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-label="返回"
      >
        <IconBack size={22} />
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-14 z-[1] flex flex-col">
        <div
          className={`loot-flip-scene flex min-h-0 flex-1 items-center justify-center px-8 ${
            entered ? "loot-flip-in" : "loot-flip-out"
          }`}
        >
          <div className="loot-flip-card pointer-events-auto relative w-full max-w-[300px] rounded-[24px] border border-[#EDE4D6] bg-white px-5 py-8">
            <h2 className="px-2 text-center text-[24px] font-bold leading-snug tracking-tight text-ink">
              {item?.title || "…"}
            </h2>
            <div className="mt-4 flex items-center justify-center gap-2">
              {item?.category ? (
                <span
                  className="inline-flex rounded-[10px] px-2.5 py-1 text-[12px] font-semibold"
                  style={{ background: tone.bg, color: tone.ink }}
                >
                  {item.category}
                </span>
              ) : null}
              {item?.date ? (
                <span className="text-[12px] text-muted">{formatCN(item.date)}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div
          className={`px-8 pb-[max(18px,calc(env(safe-area-inset-bottom,0px)+14px))] pt-2 transition-opacity duration-300 ${
            entered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={goReview}
            className="pointer-events-auto mx-auto block w-full max-w-[300px] rounded-full border-[1.5px] border-[#E8B24E] bg-transparent py-3.5 text-[15px] font-semibold text-[#9A7040]"
          >
            复习一下
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSheet({
  open,
  onClose,
  itemId,
  days,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string | null;
  days: Record<string, Day>;
}) {
  const {
    toggleKnowledgeStar,
    showToast,
    bumpKnowledgeReview,
    openKnowledgeEdit,
    detailFromLoot,
    showFishDanmaku,
    setKnowledgeNoteIndent,
  } = useApp();

  const [reviewedThisVisit, setReviewedThisVisit] = useState(false);
  const [indentOpen, setIndentOpen] = useState(false);
  const indentWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setReviewedThisVisit(false);
      setIndentOpen(false);
    }
  }, [open, itemId]);

  useEffect(() => {
    if (!indentOpen) return;
    const onPointer = (e: Event) => {
      if (!indentWrapRef.current?.contains(e.target as Node)) setIndentOpen(false);
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("mousedown", onPointer, true);
    document.addEventListener("touchstart", onPointer, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("mousedown", onPointer, true);
      document.removeEventListener("touchstart", onPointer, true);
    };
  }, [indentOpen]);

  const found = useMemo(() => {
    if (!itemId) return null;
    for (const day of Object.values(days)) {
      const knowledge = day.knowledge.find((k) => k.id === itemId);
      if (knowledge) return { item: knowledge, date: day.date };
    }
    return null;
  }, [days, itemId]);

  const cached = useRef(found);
  if (found) cached.current = found;
  const display = found ?? cached.current;

  if (!display) return null;
  const { item, date } = display;
  const [bg, color] = thumbPalette(item.category);
  const hasNote = !!item.note?.trim();
  const noteText = hasNote ? item.note! : "无";
  const indentFirst = item.noteIndent === "indent";

  const actionBtn =
    "flex items-center justify-center rounded-[16px] border-0 bg-fish py-3 text-[14px] font-semibold text-ink";

  return (
    <PagePush
      open={open}
      onClose={onClose}
      title="知识详情"
      layout="bar"
      zIndex={50}
      panelClassName="bg-cream"
      titleClassName="text-[15px] font-semibold text-muted"
      trailing={
        <button
          type="button"
          aria-label={item.starred ? "取消收藏" : "收藏"}
          onClick={() => {
            const next = !item.starred;
            toggleKnowledgeStar(item.id);
            showToast(next ? "已收藏" : "已取消收藏");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent"
        >
          {item.starred ? (
            <IconStar size={18} stroke="#E8B24E" />
          ) : (
            <IconStarOutline size={18} className="text-muted" />
          )}
        </button>
      }
      footer={
        detailFromLoot ? (
          <button type="button" onClick={() => openKnowledgeEdit(item.id)} className={`w-full ${actionBtn}`}>
            编辑
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (reviewedThisVisit) {
                  showFishDanmaku("刚复习过啦，歇一会儿再来～", 1000);
                  return;
                }
                bumpKnowledgeReview(item.id);
                setReviewedThisVisit(true);
                showFishDanmaku("又巩固了一点！", 1000);
              }}
              className={actionBtn}
            >
              复习
            </button>
            <button type="button" onClick={() => openKnowledgeEdit(item.id)} className={actionBtn}>
              编辑
            </button>
          </div>
        )
      }
    >
      <h2 className="pl-2.5 text-[24px] font-bold leading-[1.35] tracking-[0.01em] text-[#4A4640]">{item.title}</h2>

      <section className="relative mt-4 overflow-hidden rounded-[24px] border border-[#EDE4D6] bg-white px-4 pb-3 pt-4">
        <div className="relative flex items-center gap-2.5" ref={indentWrapRef}>
          <span
            className="inline-flex rounded-[10px] px-2.5 py-1 text-[12px] font-semibold"
            style={{ background: bg, color }}
          >
            {item.category}
          </span>
          <span className="min-w-0 flex-1 text-[13px] text-muted">{formatCN(date)}</span>
          <button
            type="button"
            aria-label="正文排版"
            aria-expanded={indentOpen}
            onClick={() => setIndentOpen((v) => !v)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-muted"
          >
            <IconChevron size={14} className={`transition-transform ${indentOpen ? "-rotate-90" : "rotate-90"}`} />
          </button>
          {indentOpen ? (
            <div className="absolute right-0 top-9 z-20 w-[132px] overflow-hidden rounded-[14px] bg-white py-1.5 shadow-[0_10px_28px_rgba(60,50,30,0.14)]">
              {(
                [
                  { id: "indent" as const, label: "首行缩进" },
                  { id: "flush" as const, label: "顶格" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setKnowledgeNoteIndent(item.id, opt.id);
                    setIndentOpen(false);
                  }}
                  className={`flex w-full border-0 bg-transparent px-3.5 py-2.5 text-left text-[14px] ${
                    (opt.id === "indent" ? indentFirst : !indentFirst)
                      ? "font-semibold text-ink"
                      : "font-normal text-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-3 mb-3.5 flex items-center gap-1.5" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-[#F0C96A]" />
          <span className="h-[3px] w-9 rounded-full bg-[#FFE7A8]" />
        </div>

        <div className="relative pb-[72px]">
          {hasNote ? (
            noteText.split("\n").map((line, i) =>
              line.length === 0 ? (
                <div key={`gap-${i}`} aria-hidden className="h-4" />
              ) : (
                <p
                  key={`line-${i}`}
                  className="font-kai text-[16px] leading-[1.9] tracking-[0.015em] text-[#3F3B36]"
                  style={{
                    margin: 0,
                    textIndent: indentFirst ? "2em" : 0,
                  }}
                >
                  {line}
                </p>
              )
            )
          ) : (
            <p className="font-kai m-0 text-[16px] leading-[1.9] text-muted">无</p>
          )}
          <img
            src="/icons/detail-fish.png?v=7"
            alt=""
            width={78}
            height={55}
            className="pointer-events-none absolute bottom-0 right-0 h-[55px] w-auto select-none object-contain opacity-[0.9]"
            draggable={false}
          />
        </div>
      </section>

      {item.source ? (
        <p className="mt-3 pl-2.5 text-[13px] leading-snug text-muted">来源 · {item.source}</p>
      ) : null}

      {item.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span key={t} className="rounded-full bg-cream-deep px-2.5 py-1 text-[12px] text-muted">
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </PagePush>
  );
}

function BackupSheet({
  open,
  onClose,
  showToast,
}: {
  open: boolean;
  onClose: () => void;
  showToast: (m: string) => void;
}) {
  const { data, importData } = useApp();
  return (
    <BottomSheet open={open} onClose={onClose} title="数据备份">
      <p className="mb-4 text-[13px] text-muted">数据完全保存在本机。</p>
      <div className="space-y-2">
        <PrimaryButton
          onClick={async () => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `摸摸鱼-备份-${todayKey()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("备份已准备好。");
          }}
        >
          导出备份
        </PrimaryButton>
        <label className="flex w-full cursor-pointer items-center justify-center rounded-[16px] bg-cream py-3.5 text-[15px] font-semibold">
          导入数据
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const json = JSON.parse(await file.text());
                importData(json);
                onClose();
              } catch {
                showToast("导入失败");
              }
            }}
          />
        </label>
      </div>
    </BottomSheet>
  );
}
