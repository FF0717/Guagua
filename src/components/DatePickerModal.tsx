import { useEffect, useMemo, useRef, useState } from "react";

const ITEM_H = 36;
const VISIBLE = 3;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;
const WHEEL_H = ITEM_H * VISIBLE;

const DEFAULT_MIN = "2026-08-01";

function todayYmd() {
  const n = new Date();
  return toYmd(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseYmd(value: string): { y: number; m: number; d: number } | null {
  const [yy, mm, dd] = value.split("-").map(Number);
  if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  return { y: yy, m: mm, d: dd };
}

function toYmd(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function cmpYmd(
  a: { y: number; m: number; d: number },
  b: { y: number; m: number; d: number }
) {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

function clampYmd(
  year: number,
  month: number,
  day: number,
  min: { y: number; m: number; d: number },
  max: { y: number; m: number; d: number }
) {
  let y = Math.min(max.y, Math.max(min.y, year));
  const minMonth = y === min.y ? min.m : 1;
  const maxMonth = y === max.y ? max.m : 12;
  let m = Math.min(maxMonth, Math.max(minMonth, month));
  const minDay = y === min.y && m === min.m ? min.d : 1;
  const maxDay =
    y === max.y && m === max.m ? Math.min(max.d, daysInMonth(y, m)) : daysInMonth(y, m);
  let d = Math.min(maxDay, Math.max(minDay, day));
  return { y, m, d };
}

function WheelColumn({
  values,
  value,
  onChange,
  isBlocked,
  onBlocked,
  snapValue,
  format = String,
  className = "flex-1",
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  isBlocked?: (v: number) => boolean;
  onBlocked?: () => void;
  /** 滑到不可选时回弹到的值 */
  snapValue?: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const timer = useRef<number | null>(null);
  const snapRef = useRef(snapValue ?? value);
  snapRef.current = snapValue ?? value;

  useEffect(() => {
    const el = ref.current;
    if (!el || lock.current) return;
    const idx = Math.max(0, values.indexOf(value));
    el.scrollTop = idx * ITEM_H;
  }, [value, values]);

  const settle = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_H)));
    const raw = values[idx]!;
    lock.current = true;

    if (isBlocked?.(raw)) {
      onBlocked?.();
      const snap = snapRef.current;
      const snapIdx = Math.max(0, values.indexOf(snap));
      el.scrollTo({ top: snapIdx * ITEM_H, behavior: "smooth" });
      onChange(snap);
    } else {
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      onChange(raw);
    }

    window.setTimeout(() => {
      lock.current = false;
    }, 160);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height: WHEEL_H }}>
      <div
        ref={ref}
        className="h-full overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "y mandatory" }}
        onScroll={() => {
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(settle, 80);
        }}
      >
        <div style={{ height: PAD }} />
        {values.map((v) => {
          const blocked = Boolean(isBlocked?.(v));
          return (
            <div
              key={v}
              className={`flex items-center justify-center text-[17px] font-medium leading-none tabular-nums ${
                blocked ? "text-[#C8C4BC] opacity-40" : "text-[#8a8680]"
              }`}
              style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            >
              <span className="translate-y-[1px]">{format(v)}</span>
            </div>
          );
        })}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
}

export function DatePickerModal({
  open,
  value,
  onCancel,
  onConfirm,
  onBlocked,
  confirmClassName = "text-spend-ink",
  confirmLabel = "确定",
  title = "选择日期",
  minDate = DEFAULT_MIN,
  maxDate,
}: {
  open: boolean;
  value: string; // yyyy-MM-dd
  onCancel: () => void;
  onConfirm: (ymd: string) => void;
  /** 滑到 / 点选还没到的日期时回调（如弹幕「时间还没到呢」） */
  onBlocked?: () => void;
  confirmClassName?: string;
  confirmLabel?: string;
  title?: string;
  /** 最早可选日 yyyy-MM-dd */
  minDate?: string;
  /** 最晚可选日 yyyy-MM-dd；默认今天，之后的日期灰显不可选 */
  maxDate?: string;
}) {
  const resolvedMax = maxDate ?? todayYmd();
  const min = useMemo(() => parseYmd(minDate) || parseYmd(DEFAULT_MIN)!, [minDate]);
  const max = useMemo(() => parseYmd(resolvedMax) || parseYmd(todayYmd())!, [resolvedMax]);
  /** 滚轮展示到可选上限后再多一年，方便看到灰色未来 */
  const displayMaxY = max.y + 1;

  const [y, setY] = useState(min.y);
  const [m, setM] = useState(min.m);
  const [d, setD] = useState(min.d);

  useEffect(() => {
    if (!open) return;
    const parsed = parseYmd(value);
    const next = clampYmd(
      parsed?.y ?? min.y,
      parsed?.m ?? min.m,
      parsed?.d ?? min.d,
      min,
      max
    );
    setY(next.y);
    setM(next.m);
    setD(next.d);
  }, [open, value, min, max]);

  const years = useMemo(
    () => Array.from({ length: displayMaxY - min.y + 1 }, (_, i) => min.y + i),
    [min.y, displayMaxY]
  );
  const months = useMemo(() => {
    const start = y === min.y ? min.m : 1;
    return Array.from({ length: 12 - start + 1 }, (_, i) => start + i);
  }, [y, min.y, min.m]);
  const days = useMemo(() => {
    const start = y === min.y && m === min.m ? min.d : 1;
    const end = daysInMonth(y, m);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [y, m, min.y, min.m, min.d]);

  const yearBlocked = (yy: number) => yy > max.y;
  const monthBlocked = (mm: number) =>
    y > max.y || (y === max.y && mm > max.m) || (y === min.y && mm < min.m);
  const dayBlocked = (dd: number) => cmpYmd({ y, m, d: dd }, max) > 0 || cmpYmd({ y, m, d: dd }, min) < 0;

  const snapYear = max.y;
  const snapMonth = clampYmd(y, m, d, min, max).m;
  const snapDay = clampYmd(y, m, d, min, max).d;

  /** 换年/月后把日夹到合法范围（不弹提示） */
  useEffect(() => {
    const dim = daysInMonth(y, m);
    if (d > dim) setD(dim);
  }, [y, m, d]);

  if (!open) return null;

  const tryConfirm = () => {
    const cur = { y, m, d };
    if (cmpYmd(cur, max) > 0 || cmpYmd(cur, min) < 0) {
      onBlocked?.();
      const next = clampYmd(y, m, d, min, max);
      setY(next.y);
      setM(next.m);
      setD(next.d);
      return;
    }
    onConfirm(toYmd(y, m, d));
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center px-10" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/35"
        aria-label="关闭"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-[280px] overflow-hidden rounded-[18px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="border-0 bg-transparent px-0.5 text-[14px] font-medium text-[#9a9690]"
          >
            取消
          </button>
          <span className="text-[14px] font-semibold text-[#6b6760]">{title}</span>
          <button
            type="button"
            onClick={tryConfirm}
            className={`border-0 bg-transparent px-0.5 text-[14px] font-semibold ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>

        <div className="px-3 pb-3.5 pt-1">
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 rounded-[10px] bg-cream-deep"
              style={{ height: ITEM_H }}
            />
            <div className="relative z-[2] flex items-center gap-0 justify-center">
              <WheelColumn
                values={years}
                value={y}
                onChange={setY}
                isBlocked={yearBlocked}
                onBlocked={onBlocked}
                snapValue={snapYear}
                format={(v) => `${v}年`}
                className="w-[88px] flex-none"
              />
              <WheelColumn
                values={months}
                value={m}
                onChange={setM}
                isBlocked={monthBlocked}
                onBlocked={onBlocked}
                snapValue={snapMonth}
                format={(v) => `${v}月`}
                className="w-[56px] flex-none"
              />
              <WheelColumn
                values={days}
                value={d}
                onChange={setD}
                isBlocked={dayBlocked}
                onBlocked={onBlocked}
                snapValue={snapDay}
                format={(v) => `${v}日`}
                className="w-[56px] flex-none"
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-10 bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-10 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
