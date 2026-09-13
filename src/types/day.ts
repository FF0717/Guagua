export type TabId = "home" | "favorites" | "review" | "mine";

export type FishMood = "idle" | "happy" | "study" | "sleep" | "miss";

export type PokeKind = "discovery" | "life" | "spend" | "note" | "highlight";

export interface KnowledgeItem {
  id: string;
  title: string;
  note: string;
  category: string;
  source?: string;
  tags?: string[];
  starred?: boolean;
  /** 复习次数，默认 0 */
  reviewCount?: number;
  /** 详情正文：首行缩进 / 顶格，默认顶格 */
  noteIndent?: "indent" | "flush";
  createdAt: number;
}

export interface LifeItem {
  id: string;
  name: string;
  minutes: number;
  icon?: string;
  note?: string;
  /** 开始时间 HH:mm */
  startHm?: string;
  createdAt?: number;
}

export interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  note?: string;
  payment?: string;
  createdAt: number;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  doneAt?: number;
}

/** Day is the product core object */
export interface Day {
  date: string;
  knowledge: KnowledgeItem[];
  life: LifeItem[];
  expenses: ExpenseItem[];
  shortNote: string;
  journal: string;
  /** 日志正文：首行缩进 / 顶格，默认顶格 */
  journalIndent?: "indent" | "flush";
  /** 日志心情 id，空字符串表示未选 */
  mood: string;
  /** 日志天气 id，空字符串表示未选 */
  weather: string;
  highlight: boolean;
  highlightText: string;
  todos: TodoItem[];
}

/** 性别：空 = 未设置 */
export type GenderOption = "" | "female" | "male" | "secret";

export interface Settings {
  displayName: string;
  /** 用户头像 data URL，空 = 未设置 */
  avatarDataUrl: string;
  /** 用户性别 */
  userGender: GenderOption;
  /** 用户生日 yyyy-MM-dd，空 = 未设置 */
  userBirthday: string;
  /** 地区 · 省 */
  regionProvince: string;
  /** 地区 · 市 */
  regionCity: string;
  fishName: string;
  /** 小鱼性别（旧字段，保留兼容） */
  fishGender: GenderOption;
  /** 小鱼生日（旧字段，保留兼容） */
  fishBirthday: string;
  fishRemind: boolean;
  startedAt: string;
  categories: string[];
  lifeCatalog: { id: string; name: string; icon: string }[];
  onboarded: boolean;
  /** 灵感主题：random = 随机主题，否则为 11 类之一 */
  inspireTheme: string;
}

export interface AppData {
  version: 2;
  days: Record<string, Day>;
  settings: Settings;
  inspireCategory: string;
}

export const STORAGE_KEY = "momoyu.app.v2";

export const DEFAULT_CATEGORIES = [
  "人文",
  "历史",
  "地理",
  "社会",
  "法律",
  "财经",
  "理工",
  "科技",
  "心理",
  "健康",
  "运动",
  "生活",
  "技能",
  "思辨",
];

/** 系统用：删除自定义分类后，相关知识归到此；只出现在知识页胶囊，不进学一学选择器 */
export const UNCATEGORIZED = "未分类";

/** 旧版内置分类，加载时迁移掉，只保留用户自定义 */
export const LEGACY_DEFAULT_CATEGORIES = [
  "人文",
  "历史",
  "地理",
  "社会",
  "法律",
  "财经",
  "理工",
  "科技",
  "心理",
  "健康",
  "运动",
  "生活",
  "技能",
  "思辨",
  "自然",
  "学术",
  "资料",
  "体育",
  "健身",
  "运动科学",
  "做饭",
  "菜谱",
  "烘焙",
  "饮品",
  "营养学",
  "军事",
  "武器装备",
  "国际时事",
  "外交",
  "中国史",
  "世界史",
  "考古",
  "国家与城市",
  "气候气象",
  "人工智能",
  "互联网",
  "航天",
  "数码",
  "自然科学",
  "物理",
  "化学",
  "天文",
  "医学健康",
  "睡眠",
  "急救常识",
  "金融理财",
  "金融",
  "经济",
  "商业",
  "创业",
  "社会议题",
  "语言",
  "生僻字",
  "英语表达",
  "方言",
  "文学",
  "诗词",
  "写作",
  "艺术",
  "设计",
  "建筑",
  "摄影",
  "音乐",
  "电影",
  "戏剧",
  "电影戏剧",
  "哲学",
  "宗教文化",
  "民俗传统",
  "动物自然",
  "动物",
  "环保",
  "旅行",
  "交通出行",
  "汽车",
  "时尚穿搭",
  "家居生活",
  "生活常识",
  "教育学习",
  "职场技能",
  "沟通表达",
  "生活技能",
  "办公技能",
  "动手技能",
  "社交技能",
  "学习技能",
  "时间管理",
  "自制力训练",
  "编程开发",
  "产品思维",
  "专业名词",
  "冷知识",
  "其他",
];

export const EXPENSE_CATEGORIES = [
  "餐饮",
  "交通",
  "购物",
  "生活",
  "娱乐",
  "健康",
  "订阅",
  "其他",
];

export const PAYMENT_METHODS = ["微信", "支付宝", "现金", "其他"] as const;

export const DEFAULT_LIFE_CATALOG = [
  { id: "read", name: "阅读", icon: "📖" },
  { id: "study", name: "学习", icon: "📚" },
  { id: "work", name: "工作", icon: "💼" },
  { id: "sport", name: "运动", icon: "🏓" },
  { id: "cook", name: "做饭", icon: "🍳" },
  { id: "walk", name: "散步", icon: "🎧" },
  { id: "play", name: "娱乐", icon: "🎬" },
  { id: "other", name: "其他", icon: "···" },
];

export { INSPIRE_LIST } from "../lib/inspire";

