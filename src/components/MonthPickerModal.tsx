import { useEffect, useMemo, useRef, useState } from "react";

const ITEM_H = 36;
const VISIBLE = 3;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;
const WHEEL_H = ITEM_H * VISIBLE;
/** -1 = 全部（整年 / 当年已过月份） */
const MONTH_OPTIONS = [-1, ...Array.from({ length: 12 }, (_, i) => i)];

function clampPick(value: number, capped: number) {
  if (value === -1) return -1;
  return Math.min(capped, Math.max(0, value));
}

function WheelColumn({
  values,
  value,
  maxValue,
  onChange,
  onBlocked,
  format,
}: {
  values: number[];
  value: number;
  maxValue: number;
  onChange: (v: number) => void;
  onBlocked?: () => void;
  format: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const timer = useRef<number | null>(null);
  const maxRef = useRef(maxValue);
  maxRef.current = maxValue;

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
    const cap = maxRef.current;
    lock.current = true;

    if (raw > cap) {
      onBlocked?.();
      const allowedIdx = Math.max(0, values.indexOf(cap));
      el.scrollTo({ top: allowedIdx * ITEM_H, behavior: "smooth" });
      onChange(cap);
    } else {
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      onChange(raw);
    }

    window.setTimeout(() => {
      lock.current = false;
    }, 160);
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: WHEEL_H }}>
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
          const blocked = v > maxValue;
          return (
            <div
              key={v}
              className={`flex items-center justify-center text-[18px] font-medium leading-none ${
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

export function MonthPickerModal({
  open,
  value,
  maxMonth = 11,
  onCancel,
  onConfirm,
  onBlocked,
}: {
  open: boolean;
  /** -1 = 全部；0–11 = 月份 */
  value: number;
  /** 当年可选的最晚月份 0–11；更晚的月份仍显示，滑到会回弹 */
  maxMonth?: number;
  onCancel: () => void;
  onConfirm: (month: number) => void;
  onBlocked?: () => void;
}) {
  const capped = Math.min(11, Math.max(0, maxMonth));
  const months = useMemo(() => MONTH_OPTIONS, []);
  const [m, setM] = useState(() => clampPick(value, capped));

  useEffect(() => {
    if (!open) return;
    setM(clampPick(value, capped));
  }, [open, value, capped]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-12"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/35"
        aria-label="关闭"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-[240px] overflow-hidden rounded-[18px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="border-0 bg-transparent px-0.5 text-[14px] font-medium text-[#9a9690]"
          >
            取消
          </button>
          <span className="text-[14px] font-semibold text-[#6b6760]">选择月份</span>
          <button
            type="button"
            onClick={() => {
              if (m !== -1 && m > capped) {
                onBlocked?.();
                setM(capped);
                return;
              }
              onConfirm(clampPick(m, capped));
            }}
            className="border-0 bg-transparent px-0.5 text-[14px] font-semibold text-fish-deep"
          >
            确定
          </button>
        </div>

        <div className="px-3 pb-3.5 pt-1">
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 rounded-[10px] bg-cream-deep"
              style={{ height: ITEM_H }}
            />
            <div className="relative z-[2]">
              <WheelColumn
                values={months}
                value={m}
                maxValue={capped}
                onChange={setM}
                onBlocked={onBlocked}
                format={(v) => (v === -1 ? "全部" : `${v + 1}月`)}
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
