import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  Day,
  ExpenseItem,
  FishMood,
  KnowledgeItem,
  PokeKind,
  TabId,
} from "../types/day";
import { DEFAULT_CATEGORIES, UNCATEGORIZED } from "../types/day";
import { nextFishLine } from "../lib/fishLines";
import { ensureInspireImage, getInspireVisual, resolveInspireForTheme, type InspireThemeId, isInspireThemeId, INSPIRE_THEME_RANDOM } from "../lib/inspire";
import { ensureDay, loadAppData, msUntilNextLocalMidnight, pickInspire, resolveFishName, saveAppData, todayKey, uid } from "../lib/storage";

type ToastState = { message: string; fish?: boolean } | null;

type SheetKind =
  | null
  | "poke"
  | "discovery"
  | "life"
  | "spend"
  | "note"
  | "highlight"
  | "day"
  | "detail"
  | "backup";

type PageKind =
  | null
  | "reminders"
  | "discovery"
  | "life"
  | "spend"
  | "note"
  | "harvest"
  | "journal"
  | "loot"
  | "categories"
  | "achievements"
  | "profile";

type NoteReturnTo = "journal" | "day" | "harvest" | null;

export type DayFocus = "all" | "knowledge" | "life" | "spend" | "journal";

interface AppContextValue {
  data: AppData;
  tab: TabId;
  setTab: (t: TabId) => void;
  sheet: SheetKind;
  openSheet: (s: SheetKind) => void;
  closeSheet: () => void;
  page: PageKind;
  openPage: (p: PageKind) => void;
  closePage: () => void;
  /** 从「我的日志」打开写一句，关闭后回到日志 */
  openJournalNote: () => void;
  /** 从某天详情打开编辑日志 */
  openDayNote: (date: string) => void;
  noteEditDate: string;
  /** 写一句关闭后回到哪里 */
  noteReturnTo: NoteReturnTo;
  /** 从日志记录进入编辑时锁定日期 */
  noteDateLocked: boolean;
  /** 写一句是否叠在日志页上（用于保持日志页挂载） */
  noteFromJournal: boolean;
  fishMood: FishMood;
  toast: ToastState;
  showToast: (message: string) => void;
  /** 导航栏小鱼弹幕 */
  fishDanmaku: { id: number; text: string; holdMs?: number } | null;
  pokeTabFish: () => void;
  /** 自定义文案弹幕；holdMs 为停留时长（默认约 2s） */
  showFishDanmaku: (text: string, holdMs?: number) => void;
  clearFishDanmaku: () => void;
  celebrate: (kind?: PokeKind) => void;
  /** 本地日历日 yyyy-MM-dd，过零点会更新 */
  calendarDay: string;
  today: Day;
  reviewMonth: { year: number; month: number };
  setReviewMonth: (y: number, m: number) => void;
  selectedDay: string | null;
  dayFocus: DayFocus;
  openDay: (key: string, focus?: DayFocus) => void;
  openHarvest: (focus?: DayFocus) => void;
  selectedKnowledgeId: string | null;
  /** 知识详情关闭后回到 day / harvest；用于叠层时保持下层挂载 */
  detailBackTo: "day" | "harvest" | null;
  /** 从「捞一条 → 我想好了」进入详情；隐藏「复习」按钮 */
  detailFromLoot: boolean;
  openKnowledge: (id: string, date?: string, opts?: { fromLoot?: boolean }) => void;
  /** 编辑已有知识时打开学一学页 */
  knowledgeEditId: string | null;
  openKnowledgeEdit: (id: string) => void;
  /** 「今天捞一条」随机复习 p1 当前条目 */
  lootKnowledgeId: string | null;
  openLootReview: () => void;
  search: string;
  setSearch: (q: string) => void;
  filter: string;
  setFilter: (f: string) => void;
  addKnowledge: (item: Omit<KnowledgeItem, "id" | "createdAt" | "reviewCount">) => void;
  updateKnowledge: (
    id: string,
    patch: {
      title: string;
      note: string;
      category: string;
      source?: string;
      tags?: string[];
    }
  ) => void;
  bumpKnowledgeReview: (id: string) => void;
  setKnowledgeNoteIndent: (id: string, indent: "indent" | "flush") => void;
  setJournalIndent: (date: string, indent: "indent" | "flush") => void;
  addLife: (name: string, minutes: number, icon?: string, note?: string, startHm?: string) => void;
  addExpense: (item: Omit<ExpenseItem, "id" | "createdAt"> & { date?: string }) => void;
  saveNote: (
    headline: string,
    body?: string,
    date?: string,
    mood?: string | null,
    weather?: string | null
  ) => void;
  clearDayNotes: (date: string) => void;
  saveHighlight: (text: string) => void;
  toggleHighlight: (date: string) => void;
  addTodo: (text?: string) => string;
  updateTodo: (id: string, text: string, date?: string) => void;
  toggleTodo: (id: string, date?: string) => void;
  deleteTodo: (id: string, date?: string) => void;
  deleteDay: (date: string) => void;
  deleteKnowledge: (id: string, date?: string) => void;
  deleteLife: (id: string, date?: string) => void;
  deleteExpense: (id: string, date?: string) => void;
  toggleKnowledgeStar: (id: string) => void;
  updateSettings: (patch: Partial<AppData["settings"]>) => void;
  /** 删除自定义知识分类；其下知识改到「未分类」 */
  removeKnowledgeCategory: (name: string) => void;
  shuffleInspire: () => Promise<void>;
  setInspireTheme: (theme: InspireThemeId) => Promise<void>;
  importData: (raw: AppData) => void;
  daysAway: number;
}

const AppContext = createContext<AppContextValue | null>(null);

function feedbackFor(kind: PokeKind | undefined, fishName: string) {
  const name = fishName.trim() || "Memo";
  switch (kind) {
    case "discovery":
      return "又学到新东西啦！";
    case "life":
      return `都记在${name}心里啦！`;
    case "spend":
      return `${name}会保护好你的钱包！`;
    case "note":
      return "把今天留下来啦！";
    case "highlight":
      return "这一天被你标成了高光。";
    default:
      return "咕噜，被摸到了。";
  }
}

function resolveFishMood(startedAt: string, force?: FishMood | null): FishMood {
  if (force) return force;
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) return "sleep";
  try {
    const last = localStorage.getItem("momoyu.lastOpen");
    if (last) {
      const days = Math.floor((Date.now() - Number(last)) / 86400000);
      if (days >= 3) return "miss";
    }
  } catch {
    /* ignore */
  }
  void startedAt;
  return "idle";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const skipFirstSave = useRef(true);
  const [tab, setTab] = useState<TabId>("home");
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [page, setPage] = useState<PageKind>(null);
  const pageRef = useRef(page);
  const sheetRef = useRef(sheet);
  pageRef.current = page;
  sheetRef.current = sheet;
  const [toast, setToast] = useState<ToastState>(null);
  const [fishDanmaku, setFishDanmaku] = useState<{ id: number; text: string; holdMs?: number } | null>(null);
  const [forcedMood, setForcedMood] = useState<FishMood | null>(null);
  const [reviewMonth, setReviewMonthState] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayFocus, setDayFocus] = useState<DayFocus>("all");
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(null);
  const [detailBackTo, setDetailBackTo] = useState<"day" | "harvest" | null>(null);
  const [detailFromLoot, setDetailFromLoot] = useState(false);
  const [knowledgeEditId, setKnowledgeEditId] = useState<string | null>(null);
  const [lootKnowledgeId, setLootKnowledgeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("全部");
  const [noteFromJournal, setNoteFromJournal] = useState(false);
  const [noteEditDate, setNoteEditDate] = useState(() => todayKey());
  const [noteReturnTo, setNoteReturnTo] = useState<NoteReturnTo>(null);
  const noteReturnToRef = useRef(noteReturnTo);
  noteReturnToRef.current = noteReturnTo;
  const [calendarDay, setCalendarDay] = useState(() => todayKey());

  useEffect(() => {
    let timeout = 0;
    const sync = () => {
      const next = todayKey();
      setCalendarDay((cur) => (cur === next ? cur : next));
    };
    const armMidnight = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        sync();
        armMidnight();
      }, msUntilNextLocalMidnight());
    };
    const onWake = () => {
      sync();
      armMidnight();
    };
    armMidnight();
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    const poll = window.setInterval(sync, 30_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
    };
  }, []);

  useEffect(() => {
    if (pageRef.current === "note") return;
    setNoteEditDate(calendarDay);
  }, [calendarDay]);

  useEffect(() => {
    // 跳过首屏写入，避免加载失败时的空数据立刻覆盖本地旧记录
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    saveAppData(data);
  }, [data]);

  useEffect(() => {
    localStorage.setItem("momoyu.lastOpen", String(Date.now()));
  }, []);

  useEffect(() => {
    if (!forcedMood) return;
    const t = window.setTimeout(() => setForcedMood(null), 1600);
    return () => window.clearTimeout(t);
  }, [forcedMood]);

  const fishMood = useMemo(
    () => resolveFishMood(data.settings.startedAt, forcedMood),
    [data.settings.startedAt, forcedMood]
  );

  const daysAway = useMemo(() => {
    try {
      const last = localStorage.getItem("momoyu.lastOpen");
      if (!last) return 0;
      return Math.floor((Date.now() - Number(last)) / 86400000);
    } catch {
      return 0;
    }
  }, []);

  const today = useMemo(() => {
    const key = calendarDay;
    return data.days[key] || ensureDay({ ...data }, key);
  }, [data, calendarDay]);

  const showToast = useCallback((message: string) => {
    setToast({ message, fish: true });
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const pokeTabFish = useCallback(() => {
    setFishDanmaku({
      id: Date.now(),
      text: nextFishLine(resolveFishName(dataRef.current.settings.fishName)),
    });
  }, []);

  const showFishDanmaku = useCallback((text: string, holdMs = 2000) => {
    setFishDanmaku({ id: Date.now(), text, holdMs });
  }, []);

  const clearFishDanmaku = useCallback(() => {
    setFishDanmaku(null);
  }, []);

  const celebrate = useCallback(
    (kind?: PokeKind) => {
      setForcedMood(kind === "discovery" ? "study" : "happy");
      showToast(feedbackFor(kind, resolveFishName(dataRef.current.settings.fishName)));
    },
    [showToast]
  );

  const patchToday = useCallback((mutator: (day: Day) => void) => {
    setData((prev) => {
      const next = structuredClone(prev);
      const day = ensureDay(next, todayKey());
      mutator(day);
      return next;
    });
  }, []);

  const patchDay = useCallback((date: string, mutator: (day: Day) => void) => {
    setData((prev) => {
      const next = structuredClone(prev);
      const day = ensureDay(next, date);
      mutator(day);
      return next;
    });
  }, []);

  const addKnowledge = useCallback(
    (item: Omit<KnowledgeItem, "id" | "createdAt" | "reviewCount">) => {
      patchToday((day) => {
        day.knowledge.unshift({
          ...item,
          id: uid("k"),
          createdAt: Date.now(),
          reviewCount: 0,
        });
      });
      setSheet(null);
      setPage(null);
      setKnowledgeEditId(null);
      celebrate("discovery");
    },
    [celebrate, patchToday]
  );

  const updateKnowledge = useCallback(
    (
      id: string,
      patch: {
        title: string;
        note: string;
        category: string;
        source?: string;
        tags?: string[];
      }
    ) => {
      setData((prev) => {
        const next = structuredClone(prev);
        for (const day of Object.values(next.days)) {
          const item = day.knowledge.find((k) => k.id === id);
          if (item) {
            item.title = patch.title;
            item.note = patch.note;
            item.category = patch.category;
            item.source = patch.source;
            item.tags = patch.tags;
            break;
          }
        }
        return next;
      });
      setKnowledgeEditId(null);
      setPage(null);
    },
    []
  );

  const bumpKnowledgeReview = useCallback((id: string) => {
    setData((prev) => {
      for (const [date, day] of Object.entries(prev.days)) {
        const idx = day.knowledge.findIndex((k) => k.id === id);
        if (idx < 0) continue;
        const item = day.knowledge[idx];
        const reviewCount = (item.reviewCount || 0) + 1;
        return {
          ...prev,
          days: {
            ...prev.days,
            [date]: {
              ...day,
              knowledge: day.knowledge.map((k, i) => (i === idx ? { ...k, reviewCount } : k)),
            },
          },
        };
      }
      return prev;
    });
  }, []);

  const setKnowledgeNoteIndent = useCallback((id: string, indent: "indent" | "flush") => {
    setData((prev) => {
      const next = structuredClone(prev);
      for (const day of Object.values(next.days)) {
        const item = day.knowledge.find((k) => k.id === id);
        if (item) {
          item.noteIndent = indent;
          break;
        }
      }
      return next;
    });
  }, []);

  const setJournalIndent = useCallback((date: string, indent: "indent" | "flush") => {
    patchDay(date, (day) => {
      day.journalIndent = indent;
    });
  }, [patchDay]);

  const addLife = useCallback(
    (name: string, minutes: number, icon = "", note = "", startHm = "") => {
      const trimmed = note.trim();
      const hm = /^\d{1,2}:\d{2}$/.test(startHm) ? startHm : undefined;
      patchToday((day) => {
        // 每次单独记一条，才能保留「几点到几点」
        day.life.unshift({
          id: uid("l"),
          name,
          minutes,
          icon,
          note: trimmed || undefined,
          startHm: hm,
          createdAt: Date.now(),
        });
      });
      setSheet(null);
      setPage(null);
      celebrate("life");
    },
    [celebrate, patchToday]
  );

  const addExpense = useCallback(
    (item: Omit<ExpenseItem, "id" | "createdAt"> & { date?: string }) => {
      const date = item.date || todayKey();
      setData((prev) => {
        const next = structuredClone(prev);
        const day = ensureDay(next, date);
        day.expenses.unshift({
          id: uid("e"),
          amount: item.amount,
          category: item.category,
          note: item.note,
          payment: item.payment,
          createdAt: Date.now(),
        });
        return next;
      });
      setSheet(null);
      setPage(null);
      celebrate("spend");
    },
    [celebrate]
  );

  const saveNote = useCallback(
    (
      headline: string,
      body = "",
      dateArg?: string,
      mood: string | null = null,
      weather: string | null = null
    ) => {
      const line = headline.trim().slice(0, 18);
      const detail = body.trim().slice(0, 1000);
      const date = dateArg || noteEditDate || todayKey();
      patchDay(date, (day) => {
        day.shortNote = line;
        day.journal = detail;
        day.mood = (mood || "").trim();
        day.weather = (weather || "").trim();
      });
      setNoteEditDate(date);
      const back = noteReturnToRef.current;
      setNoteReturnTo(null);
      setNoteFromJournal(false);
      if (back === "harvest") {
        setPage("harvest");
      } else if (back === "journal") {
        setPage("journal");
      } else {
        setPage(null);
      }
      if (back !== "day" && back !== "harvest") setSheet(null);
      if (line || detail) celebrate("note");
      else showToast("已清空");
    },
    [celebrate, noteEditDate, patchDay, showToast]
  );

  const clearDayNotes = useCallback(
    (date: string) => {
      patchDay(date, (day) => {
        day.shortNote = "";
        day.journal = "";
        day.mood = "";
        day.weather = "";
      });
      showToast("已删除");
    },
    [patchDay, showToast]
  );

  const saveHighlight = useCallback(
    (text: string) => {
      patchToday((day) => {
        day.highlight = true;
        day.highlightText = text.slice(0, 80);
        if (!day.shortNote.trim()) day.shortNote = text.slice(0, 40);
      });
      setSheet(null);
      celebrate("highlight");
    },
    [celebrate, patchToday]
  );

  const toggleHighlight = useCallback((date: string) => {
    setData((prev) => {
      const next = structuredClone(prev);
      const day = ensureDay(next, date);
      day.highlight = !day.highlight;
      return next;
    });
  }, []);

  const addTodo = useCallback((text = "") => {
    const id = uid("t");
    patchToday((day) => {
      day.todos.unshift({
        id,
        text: text.trim().slice(0, 80),
        done: false,
        createdAt: Date.now(),
      });
    });
    return id;
  }, [patchToday]);

  const updateTodo = useCallback((id: string, text: string, date = todayKey()) => {
    patchDay(date, (day) => {
      const item = day.todos.find((x) => x.id === id);
      if (!item) return;
      item.text = text.slice(0, 80);
    });
  }, [patchDay]);

  const toggleTodo = useCallback((id: string, date = todayKey()) => {
    patchDay(date, (day) => {
      const item = day.todos.find((x) => x.id === id);
      if (!item) return;
      item.done = !item.done;
      item.doneAt = item.done ? Date.now() : undefined;
      const open = day.todos.filter((t) => !t.done);
      const done = day.todos
        .filter((t) => t.done)
        .sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
      day.todos = [...open, ...done];
    });
  }, [patchDay]);

  const deleteTodo = useCallback((id: string, date = todayKey()) => {
    patchDay(date, (day) => {
      day.todos = day.todos.filter((x) => x.id !== id);
    });
  }, [patchDay]);

  const deleteDay = useCallback(
    (date: string) => {
      setData((prev) => {
        const next = structuredClone(prev);
        delete next.days[date];
        return next;
      });
      setSelectedDay((cur) => {
        if (cur === date) {
          setSheet(null);
          setSelectedKnowledgeId(null);
          return null;
        }
        return cur;
      });
      showToast("已删除这一天的记录");
    },
    [showToast]
  );

  const deleteKnowledge = useCallback((id: string, date = todayKey()) => {
    patchDay(date, (day) => {
      day.knowledge = day.knowledge.filter((x) => x.id !== id);
    });
  }, [patchDay]);

  const deleteLife = useCallback((id: string, date = todayKey()) => {
    patchDay(date, (day) => {
      day.life = day.life.filter((x) => x.id !== id);
    });
  }, [patchDay]);

  const deleteExpense = useCallback((id: string, date = todayKey()) => {
    patchDay(date, (day) => {
      day.expenses = day.expenses.filter((x) => x.id !== id);
    });
  }, [patchDay]);

  const toggleKnowledgeStar = useCallback((id: string) => {
    setData((prev) => {
      const next = structuredClone(prev);
      for (const day of Object.values(next.days)) {
        const item = day.knowledge.find((k) => k.id === id);
        if (item) {
          item.starred = !item.starred;
          break;
        }
      }
      return next;
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<AppData["settings"]>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const removeKnowledgeCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || DEFAULT_CATEGORIES.includes(trimmed) || trimmed === UNCATEGORIZED) return;

    setData((prev) => {
      const next = structuredClone(prev);
      for (const day of Object.values(next.days)) {
        for (const item of day.knowledge) {
          if (item.category === trimmed) item.category = UNCATEGORIZED;
        }
      }
      // 不把「未分类」写进可选分类列表，只改知识归属
      next.settings.categories = next.settings.categories.filter(
        (c) => c !== trimmed && c !== UNCATEGORIZED
      );
      return next;
    });
    setFilter((f) => (f === trimmed ? "全部" : f));
  }, []);

  const dataRef = useRef(data);
  dataRef.current = data;
  const inspireShuffleLock = useRef(false);

  /** 先抽好下一张并等插画就绪，再一次性换文案+底色+图，避免半截闪变 */
  const shuffleInspire = useCallback(async () => {
    if (inspireShuffleLock.current) return;
    inspireShuffleLock.current = true;
    try {
      const theme = isInspireThemeId(dataRef.current.settings.inspireTheme)
        ? dataRef.current.settings.inspireTheme
        : INSPIRE_THEME_RANDOM;
      const next = pickInspire(dataRef.current.inspireCategory, theme);
      await ensureInspireImage(getInspireVisual(next).src);
      setData((prev) => ({ ...prev, inspireCategory: next }));
    } finally {
      inspireShuffleLock.current = false;
    }
  }, []);

  /** 确认主题：随机则只改模式保留文案；锁定某类时若当前不属该类则切到该类（背景随该类） */
  const setInspireTheme = useCallback(async (theme: InspireThemeId) => {
    const prev = dataRef.current;
    const nextText = resolveInspireForTheme(theme, prev.inspireCategory);
    if (nextText !== prev.inspireCategory) {
      await ensureInspireImage(getInspireVisual(nextText).src);
    }
    setData((d) => ({
      ...d,
      inspireCategory: nextText,
      settings: { ...d.settings, inspireTheme: theme },
    }));
  }, []);

  const importData = useCallback((raw: AppData) => {
    if (!raw?.days || !raw?.settings) throw new Error("bad");
    setData({ ...raw, version: 2 });
    showToast("数据回来啦。");
  }, [showToast]);

  const value: AppContextValue = {
    data,
    tab,
    setTab,
    sheet,
    openSheet: setSheet,
    closeSheet: () => {
      if (sheet === "detail" && detailBackTo === "day") {
        setSelectedKnowledgeId(null);
        setDetailBackTo(null);
        setDetailFromLoot(false);
        setSheet("day");
        return;
      }
      if (sheet === "detail" && detailBackTo === "harvest") {
        setSelectedKnowledgeId(null);
        setDetailBackTo(null);
        setDetailFromLoot(false);
        setSheet(null);
        return;
      }
      setDetailBackTo(null);
      setDetailFromLoot(false);
      setSelectedKnowledgeId(null);
      setSheet(null);
    },
    page,
    openPage: (p) => {
      if (p === "discovery") setKnowledgeEditId(null);
      if (p === "note") {
        setNoteEditDate(todayKey());
        setNoteReturnTo(null);
        setNoteFromJournal(false);
      } else {
        setNoteFromJournal(false);
        setNoteReturnTo(null);
      }
      setPage(p);
    },
    closePage: () => {
      if (page === "note") {
        const back = noteReturnToRef.current;
        setNoteReturnTo(null);
        setNoteFromJournal(false);
        if (back === "harvest") {
          setPage("harvest");
          return;
        }
        if (back === "journal") {
          setPage("journal");
          return;
        }
        if (back === "day") {
          setPage(null);
          return;
        }
        setPage(null);
        return;
      }
      setNoteReturnTo(null);
      setNoteFromJournal(false);
      setKnowledgeEditId(null);
      setLootKnowledgeId(null);
      setPage(null);
    },
    openJournalNote: () => {
      setNoteEditDate(todayKey());
      setNoteReturnTo(null);
      setNoteFromJournal(false);
      setPage("note");
    },
    openDayNote: (date: string) => {
      setNoteEditDate(date);
      const p = pageRef.current;
      const s = sheetRef.current;
      let back: NoteReturnTo = null;
      if (p === "harvest") back = "harvest";
      else if (s === "day") back = "day";
      else if (p === "journal") back = "journal";
      setNoteReturnTo(back);
      setNoteFromJournal(false);
      setPage("note");
    },
    noteEditDate,
    noteReturnTo,
    noteDateLocked: noteReturnTo === "day",
    noteFromJournal,
    fishMood,
    toast,
    showToast,
    fishDanmaku,
    pokeTabFish,
    showFishDanmaku,
    clearFishDanmaku,
    celebrate,
    calendarDay,
    today,
    reviewMonth,
    setReviewMonth: (year, month) => setReviewMonthState({ year, month }),
    selectedDay,
    dayFocus,
    openDay: (key, focus = "all") => {
      setSelectedDay(key);
      setDayFocus(focus);
      setSheet("day");
    },
    openHarvest: (focus = "all") => {
      setDayFocus(focus);
      setPage("harvest");
    },
    selectedKnowledgeId,
    detailBackTo,
    detailFromLoot,
    openKnowledge: (id, _date, opts) => {
      if (sheet === "day") setDetailBackTo("day");
      else if (page === "harvest") setDetailBackTo("harvest");
      else setDetailBackTo(null);
      setDetailFromLoot(!!opts?.fromLoot);
      setSelectedKnowledgeId(id);
      setSheet("detail");
    },
    knowledgeEditId,
    openKnowledgeEdit: (id) => {
      setKnowledgeEditId(id);
      setPage("discovery");
    },
    lootKnowledgeId,
    openLootReview: () => {
      const rows: { id: string; reviewCount: number }[] = [];
      for (const day of Object.values(data.days)) {
        for (const k of day.knowledge) {
          rows.push({
            id: k.id,
            reviewCount:
              typeof k.reviewCount === "number" && k.reviewCount > 0
                ? Math.floor(k.reviewCount)
                : 0,
          });
        }
      }
      if (!rows.length) {
        showToast("还没有知识，先留下一个发现吧。");
        return;
      }
      // 加权随机：次数越少权重越高（1/(n+1)²），不会只抽最少的那几条
      let total = 0;
      const weights = rows.map((r) => {
        const w = 1 / (r.reviewCount + 1) ** 2;
        total += w;
        return w;
      });
      let tick = Math.random() * total;
      let pick = rows[0];
      for (let i = 0; i < rows.length; i++) {
        tick -= weights[i]!;
        if (tick <= 0) {
          pick = rows[i]!;
          break;
        }
      }
      setLootKnowledgeId(pick.id);
      setPage("loot");
    },
    search,
    setSearch,
    filter,
    setFilter,
    addKnowledge,
    updateKnowledge,
    bumpKnowledgeReview,
    setKnowledgeNoteIndent,
    setJournalIndent,
    addLife,
    addExpense,
    saveNote,
    clearDayNotes,
    saveHighlight,
    toggleHighlight,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    deleteDay,
    deleteKnowledge,
    deleteLife,
    deleteExpense,
    toggleKnowledgeStar,
    updateSettings,
    removeKnowledgeCategory,
    shuffleInspire,
    setInspireTheme,
    importData,
    daysAway,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}
