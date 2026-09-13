const CN_DIGIT: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

/** 解析「十」「十一」「二十」「廿一」「三十一」等中文数字 */
function parseCnNumber(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);

  if (s === "十") return 10;
  if (s === "廿") return 20;
  if (s === "卅") return 30;

  const simple = CN_DIGIT[s];
  if (simple != null) return simple;

  // 十一 … 十九
  const teen = s.match(/^十([一二三四五六七八九])$/);
  if (teen) return 10 + CN_DIGIT[teen[1]];

  // 二十 / 廿 / 三十 / 卅
  const tensOnly = s.match(/^([二三])十$/);
  if (tensOnly) return CN_DIGIT[tensOnly[1]] * 10;

  // 二十一 … 二十九 / 廿一 …
  const tens = s.match(/^([二三廿卅])十?([一二三四五六七八九])$/);
  if (tens) {
    const t =
      tens[1] === "廿" ? 20 : tens[1] === "卅" ? 30 : CN_DIGIT[tens[1]] * 10;
    return t + CN_DIGIT[tens[2]];
  }

  return null;
}

/** 解析「8.12」「8/12」「8-12」「8月12日」「九月八」「2025-08-12」等为月日；带年份则一并返回 */
export function parseDateQuery(q: string): { year?: number; month: number; day: number } | null {
  const s = q.trim();
  if (!s) return null;

  const full = s.match(/^(?:(\d{4})[-/.年])?\s*(\d{1,2})[-/.月](\d{1,2})日?$/);
  if (full) {
    const year = full[1] ? Number(full[1]) : undefined;
    const month = Number(full[2]);
    const day = Number(full[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  const cnArabic = s.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?$/);
  if (cnArabic) {
    const month = Number(cnArabic[1]);
    const day = Number(cnArabic[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day };
    }
  }

  // 九月八 / 九月八日 / 九月八号 / 九.八 / 九/八
  const cnWord = s.match(
    /^([零〇一二两三四五六七八九十廿卅]+)\s*[月./]\s*([零〇一二两三四五六七八九十廿卅]+)\s*[日号]?$/
  );
  if (cnWord) {
    const month = parseCnNumber(cnWord[1]);
    const day = parseCnNumber(cnWord[2]);
    if (
      month != null &&
      day != null &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return { month, day };
    }
  }

  return null;
}

export function dayMatchesDateQuery(
  dateKey: string,
  parsed: { year?: number; month: number; day: number }
) {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (m !== parsed.month || d !== parsed.day) return false;
  if (parsed.year != null && y !== parsed.year) return false;
  return true;
}
