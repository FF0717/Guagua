import { UNCATEGORIZED } from "../types/day";

export type CategoryTone = { bg: string; ink: string };

/**
 * 统一分类色：胶囊标签 + 知识小鱼共用。
 * 默认 14 类一对一钉死；自定义 hash 进扩展色；未分类中性灰。
 */
export const DEFAULT_CATEGORY_TONES: Record<string, CategoryTone> = {
  技能: { bg: "#FFF0C8", ink: "#9A6B20" },
  财经: { bg: "#F8E0C8", ink: "#A06838" },
  历史: { bg: "#F0D8C8", ink: "#8A5848" },
  生活: { bg: "#F9E9E8", ink: "#8C5B5B" },
  心理: { bg: "#F4D8E4", ink: "#945068" },
  人文: { bg: "#ECDCE8", ink: "#7A5070" },
  法律: { bg: "#F3EEFC", ink: "#6B5B8C" },
  思辨: { bg: "#E0DCF0", ink: "#554878" },
  科技: { bg: "#D8E4F5", ink: "#4A6490" },
  社会: { bg: "#D8DCEF", ink: "#4A5080" },
  健康: { bg: "#D4ECEC", ink: "#3A7070" },
  运动: { bg: "#E4F2E8", ink: "#4A7357" },
  地理: { bg: "#E8ECD8", ink: "#6A7840" },
  理工: { bg: "#DCEEE6", ink: "#3F7A64" },
};

/** 自定义分类扩展色（不占用上面 14 个钉死位） */
export const CUSTOM_CATEGORY_PALETTE: CategoryTone[] = [
  { bg: "#FFF1DD", ink: "#C9843D" },
  { bg: "#E3F0EC", ink: "#5F8F82" },
  { bg: "#F6E6EE", ink: "#B07A8C" },
  { bg: "#E8F0E4", ink: "#7A9A6E" },
  { bg: "#F5EDD8", ink: "#A88848" },
  { bg: "#D7E6F2", ink: "#6A8EAB" },
  { bg: "#F0E8DF", ink: "#8A7B6C" },
  { bg: "#E8EAF6", ink: "#6D7399" },
];

export const NEUTRAL_TONE: CategoryTone = { bg: "#F0EDE8", ink: "#8A857C" };

/** @deprecated 兼容旧引用，等同自定义扩展色 */
export const CATEGORY_PALETTE = CUSTOM_CATEGORY_PALETTE;

function hashIndex(name: string, mod: number) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % mod;
}

/** 分类色：默认钉死 / 未分类中性 / 自定义进扩展池 */
export function categoryTone(name: string): CategoryTone {
  const key = (name || "").trim();
  if (!key || key === UNCATEGORIZED) return NEUTRAL_TONE;
  const pinned = DEFAULT_CATEGORY_TONES[key];
  if (pinned) return pinned;
  return CUSTOM_CATEGORY_PALETTE[hashIndex(key, CUSTOM_CATEGORY_PALETTE.length)]!;
}

/** 小鱼方块用 [bg, ink]，与 categoryTone 同一套 */
export function thumbPalette(category: string): [string, string] {
  const t = categoryTone(category);
  return [t.bg, t.ink];
}
