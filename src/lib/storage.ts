import { format, parseISO, differenceInCalendarDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import type { AppData, Day, Settings } from "../types/day";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_LIFE_CATALOG,
  LEGACY_DEFAULT_CATEGORIES,
  STORAGE_KEY,
  UNCATEGORIZED,
} from "../types/day";
import { pickInspire, isInspireThemeId, INSPIRE_THEME_RANDOM, INSPIRE_LIST } from "./inspire";

export { pickInspire } from "./inspire";
export function todayKey(d = new Date()) {
  return format(d, "yyyy-MM-dd");
}

/** 展示用小鱼名：未设置 / 空 / 旧默认「小鱼」→ Memo */
export function resolveFishName(name?: string | null) {
  const n = (name || "").trim();
  if (!n || n === "小鱼") return "Memo";
  return n;
}

/** 距本地下一天 0 点的毫秒数（多留 2 秒，避免卡在 23:59:59） */
export function msUntilNextLocalMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 2, 0);
  return Math.max(250, next.getTime() - now.getTime());
}

export function formatCN(key: string) {
  const d = parseISO(key);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 首页问候：夜深了 / 早上好 / 中午好 / 下午好 / 晚上好 */
export function greetByHour(d = new Date()) {
  const h = d.getHours();
  if (h < 6) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyDay(date: string): Day {
  return {
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
}

export function defaultSettings(): Settings {
  return {
    displayName: "",
    avatarDataUrl: "",
    userGender: "",
    userBirthday: "",
    regionProvince: "",
    regionCity: "",
    fishName: "Memo",
    fishGender: "",
    fishBirthday: "",
    fishRemind: true,
    startedAt: todayKey(),
    categories: [...DEFAULT_CATEGORIES],
    lifeCatalog: [...DEFAULT_LIFE_CATALOG],
    onboarded: false,
    inspireTheme: INSPIRE_THEME_RANDOM,
  };
}

export function defaultAppData(): AppData {
  const date = todayKey();
  return {
    version: 2,
    days: { [date]: emptyDay(date) },
    settings: defaultSettings(),
    inspireCategory: pickInspire(),
  };
}

export function mergeCategories(existing: string[] = []) {
  const legacy = new Set(LEGACY_DEFAULT_CATEGORIES);
  const defaults = new Set(DEFAULT_CATEGORIES);
  const customs: string[] = [];
  const seen = new Set<string>();
  for (const c of existing) {
    const name = (c || "").trim();
    // 「未分类」是系统归类用，不进学一学可选列表
    if (
      !name ||
      name === "其他" ||
      name === UNCATEGORIZED ||
      defaults.has(name) ||
      legacy.has(name) ||
      seen.has(name)
    ) {
      continue;
    }
    seen.add(name);
    customs.push(name);
  }
  return [...DEFAULT_CATEGORIES, ...customs];
}

const LIFE_ICON_BY_NAME: Record<string, string> = Object.fromEntries(
  DEFAULT_LIFE_CATALOG.map((c) => [c.name, c.icon])
);

/** 保留用户活动，并补上新默认项；旧版「冥想/陪伴/家务」换成「做饭/散步/娱乐」 */
export function mergeLifeCatalog(
  existing: { id: string; name: string; icon: string }[] = []
) {
  const list = Array.isArray(existing) ? [...existing] : [];

  const replaceById: Record<string, { id: string; name: string; icon: string }> = {
    meditate: { id: "cook", name: "做饭", icon: "🍳" },
    company: { id: "walk", name: "散步", icon: "🎧" },
    chores: { id: "play", name: "娱乐", icon: "🎬" },
  };
  const replaceByName: Record<string, { id: string; name: string; icon: string }> = {
    冥想: { id: "cook", name: "做饭", icon: "🍳" },
    陪伴: { id: "walk", name: "散步", icon: "🎧" },
    家务: { id: "play", name: "娱乐", icon: "🎬" },
  };

  for (let i = 0; i < list.length; i++) {
    const next =
      replaceById[list[i].id] ||
      replaceByName[list[i].name];
    if (next) list[i] = { ...next };
  }

  // 去掉「休息」
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].id === "rest" || list[i].name === "休息") {
      list.splice(i, 1);
    }
  }

  const byName = new Set(list.map((c) => c.name));

  // 刷新旧版 icon（英文 / 旧 emoji）为当前默认
  const iconById: Record<string, string> = {
    sport: "🏓",
    cook: "🍳",
    walk: "🎧",
  };
  for (const item of list) {
    const byId = iconById[item.id];
    if (byId) {
      item.icon = byId;
      continue;
    }
    const emoji = LIFE_ICON_BY_NAME[item.name];
    if (!emoji) continue;
    if (
      !item.icon ||
      /^[a-z0-9_-]+$/i.test(item.icon) ||
      (item.name === "运动" && (item.icon === "🏃" || item.icon === "💪")) ||
      (item.name === "散步" && (item.icon === "🚶" || item.icon === "🚶‍♂️" || item.icon === "🚶‍♀️")) ||
      (item.name === "做饭" && item.icon === "🍲")
    ) {
      item.icon = emoji;
    }
  }

  const mustHave = [
    { id: "work", name: "工作", icon: "💼" },
    { id: "cook", name: "做饭", icon: "🍳" },
    { id: "walk", name: "散步", icon: "🎧" },
    { id: "play", name: "娱乐", icon: "🎬" },
    { id: "other", name: "其他", icon: "···" },
  ];
  for (const item of mustHave) {
    if (!byName.has(item.name)) {
      list.push(item);
      byName.add(item.name);
    }
  }

  return list.length ? list : [...DEFAULT_LIFE_CATALOG];
}

export function loadAppData(): AppData {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    // 当前为空壳但有备份时，优先恢复备份
    if (raw) {
      try {
        const cur = JSON.parse(raw) as AppData;
        const curEmpty =
          !cur?.days ||
          !Object.values(cur.days).some(
            (d) =>
              (d.knowledge?.length || 0) > 0 ||
              (d.life?.some((x) => x.minutes > 0) ?? false) ||
              (d.expenses?.length || 0) > 0 ||
              !!d.shortNote?.trim() ||
              !!d.journal?.trim() ||
              d.highlight ||
              (d.todos?.length || 0) > 0
          );
        if (curEmpty) {
          const bak = localStorage.getItem(`${STORAGE_KEY}.bak`);
          if (bak) raw = bak;
        }
      } catch {
        /* keep raw */
      }
    } else {
      const bak = localStorage.getItem(`${STORAGE_KEY}.bak`);
      if (bak) raw = bak;
    }
    if (!raw) return defaultAppData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (!parsed || typeof parsed !== "object" || !parsed.days || !parsed.settings) {
      // 结构不对时先备份，绝不直接覆盖原数据
      try {
        localStorage.setItem(`${STORAGE_KEY}.bak`, raw);
      } catch {
        /* ignore */
      }
      return defaultAppData();
    }

    const days: Record<string, Day> = {};
    for (const [key, day] of Object.entries(parsed.days)) {
      if (!day || typeof day !== "object") continue;
      days[key] = {
        date: day.date || key,
        knowledge: Array.isArray(day.knowledge)
          ? day.knowledge.map((k) => ({
              ...k,
              reviewCount:
                typeof k.reviewCount === "number" && k.reviewCount > 0
                  ? Math.floor(k.reviewCount)
                  : 0,
              noteIndent: k.noteIndent === "indent" ? "indent" : "flush",
            }))
          : [],
        life: Array.isArray(day.life) ? day.life : [],
        expenses: Array.isArray(day.expenses) ? day.expenses : [],
        shortNote: typeof day.shortNote === "string" ? day.shortNote : "",
        journal: typeof day.journal === "string" ? day.journal : "",
        journalIndent: day.journalIndent === "indent" ? "indent" : "flush",
        mood: typeof day.mood === "string" ? day.mood : "",
        weather: typeof day.weather === "string" ? day.weather : "",
        highlight: !!day.highlight,
        highlightText: typeof day.highlightText === "string" ? day.highlightText : "",
        todos: Array.isArray(day.todos) ? day.todos : [],
      };
    }

    const rawSettings = parsed.settings || {};
    const genderOk = (g: unknown): g is Settings["userGender"] =>
      g === "" || g === "female" || g === "male" || g === "secret";
    const birthdayOk = (b: unknown) => typeof b === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b);

    const settings: Settings = {
      ...defaultSettings(),
      ...rawSettings,
      avatarDataUrl:
        typeof rawSettings.avatarDataUrl === "string" &&
        rawSettings.avatarDataUrl.startsWith("data:image/")
          ? rawSettings.avatarDataUrl
          : "",
      userGender: genderOk(rawSettings.userGender) ? rawSettings.userGender : "",
      userBirthday: birthdayOk(rawSettings.userBirthday) ? rawSettings.userBirthday : "",
      regionProvince:
        typeof rawSettings.regionProvince === "string" ? rawSettings.regionProvince : "",
      regionCity: typeof rawSettings.regionCity === "string" ? rawSettings.regionCity : "",
      fishGender: genderOk(rawSettings.fishGender) ? rawSettings.fishGender : "",
      fishBirthday: birthdayOk(rawSettings.fishBirthday) ? rawSettings.fishBirthday : "",
      fishName: resolveFishName(
        typeof rawSettings.fishName === "string" ? rawSettings.fishName : ""
      ),
      categories: mergeCategories(rawSettings.categories),
      lifeCatalog: mergeLifeCatalog(
        Array.isArray(rawSettings.lifeCatalog) ? rawSettings.lifeCatalog : []
      ),
      inspireTheme: isInspireThemeId(rawSettings.inspireTheme)
        ? rawSettings.inspireTheme
        : INSPIRE_THEME_RANDOM,
    };

    // 可选分类里已没有的自定义名：知识归到「未分类」（修复只删了标签、没挪知识）
    const allowed = new Set(settings.categories);
    allowed.add(UNCATEGORIZED);
    let remapped = false;
    for (const day of Object.values(days)) {
      for (const k of day.knowledge) {
        const cat = (k.category || "").trim();
        if (!cat || !allowed.has(cat)) {
          k.category = UNCATEGORIZED;
          remapped = true;
        }
      }
    }

    const savedInspire =
      typeof parsed.inspireCategory === "string" ? parsed.inspireCategory.trim() : "";
    const inspireCategory = INSPIRE_LIST.includes(savedInspire)
      ? savedInspire
      : pickInspire(undefined, settings.inspireTheme as typeof INSPIRE_THEME_RANDOM);

    const data: AppData = {
      version: 2,
      days,
      settings,
      inspireCategory,
    };

    if (remapped) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    }

    return data;
  } catch {
    return defaultAppData();
  }
}

export function saveAppData(data: AppData) {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    // 避免用「空壳默认数据」覆盖已有真实记录
    if (existing) {
      try {
        const prev = JSON.parse(existing) as AppData;
        const prevHas =
          prev?.days &&
          Object.values(prev.days).some(
            (d) =>
              (d.knowledge?.length || 0) > 0 ||
              (d.life?.some((x) => x.minutes > 0) ?? false) ||
              (d.expenses?.length || 0) > 0 ||
              !!d.shortNote?.trim() ||
              !!d.journal?.trim() ||
              d.highlight ||
              (d.todos?.length || 0) > 0
          );
        const nextHas = Object.values(data.days).some(
          (d) =>
            d.knowledge.length > 0 ||
            d.life.some((x) => x.minutes > 0) ||
            d.expenses.length > 0 ||
            !!d.shortNote.trim() ||
            !!d.journal.trim() ||
            d.highlight ||
            d.todos.length > 0
        );
        if (prevHas && !nextHas) {
          localStorage.setItem(`${STORAGE_KEY}.bak`, existing);
          // 仍写入（可能是用户主动清空），但已留备份
        }
      } catch {
        /* ignore */
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function ensureDay(data: AppData, date: string): Day {
  if (!data.days[date]) data.days[date] = emptyDay(date);
  return data.days[date];
}

export function dayHasLeft(day?: Day | null) {
  if (!day) return false;
  return (
    day.knowledge.length > 0 ||
    day.life.some((x) => x.minutes > 0) ||
    day.expenses.length > 0 ||
    !!day.shortNote.trim() ||
    !!day.journal.trim() ||
    !!day.highlightText.trim() ||
    day.highlight
  );
}

export function dayStats(day: Day) {
  const lifeTotal = day.life.reduce((s, x) => s + (x.minutes || 0), 0);
  const spendTotal = day.expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  return {
    know: day.knowledge.length,
    lifeTotal,
    spendTotal,
  };
}

export function formatMoney(n: number) {
  const v = Math.round(n * 100) / 100;
  return `¥${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
}

export function formatMinutes(mins: number) {
  const n = Math.max(0, Math.round(mins));
  if (n < 60) return `${n} 分钟`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h} 小时 ${m} 分` : `${h} 小时`;
}

export function companionDays(startedAt: string) {
  try {
    return Math.max(1, differenceInCalendarDays(new Date(), parseISO(startedAt)) + 1);
  } catch {
    return 1;
  }
}

export function monthKeys(year: number, monthIndex: number) {
  const start = startOfMonth(new Date(year, monthIndex, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

export function calendarPads(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  // Monday-first
  return (getDay(first) + 6) % 7;
}

export function exportPayload(data: AppData) {
  return {
    ...data,
    exportedAt: new Date().toISOString(),
  };
}
