import { useEffect, useRef, useState } from "react";

const ITEM_H = 36;
const VISIBLE = 3;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;
const WHEEL_H = ITEM_H * VISIBLE;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function WheelColumn({
  values,
  value,
  onChange,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const timer = useRef<number | null>(null);

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
    lock.current = true;
    el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    onChange(values[idx]!);
    window.setTimeout(() => {
      lock.current = false;
    }, 120);
  };

  return (
    <div className="relative flex-1 overflow-hidden" style={{ height: WHEEL_H }}>
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
        {values.map((v) => (
          <div
            key={v}
            className="flex items-center justify-center text-[18px] font-medium leading-none text-[#8a8680]"
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
          >
            <span className="translate-y-[1px]">{pad2(v)}</span>
          </div>
        ))}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
}

export function TimePickerModal({
  open,
  value,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  value: string; // HH:mm
  onCancel: () => void;
  onConfirm: (hm: string) => void;
}) {
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);

  useEffect(() => {
    if (!open) return;
    const [hh, mm] = value.split(":").map(Number);
    setH(Number.isFinite(hh) ? Math.min(23, Math.max(0, hh)) : 0);
    setM(Number.isFinite(mm) ? Math.min(59, Math.max(0, mm)) : 0);
  }, [open, value]);

  if (!open) return null;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const mins = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center px-12" role="dialog" aria-modal="true">
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
          <span className="text-[14px] font-semibold text-[#6b6760]">选择时间</span>
          <button
            type="button"
            onClick={() => onConfirm(`${pad2(h)}:${pad2(m)}`)}
            className="border-0 bg-transparent px-0.5 text-[14px] font-semibold text-life-ink"
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
            <div className="relative z-[2] flex items-center gap-1">
              <WheelColumn values={hours} value={h} onChange={setH} />
              <span className="translate-y-[1px] text-[18px] font-semibold leading-none text-[#8a8680]">:</span>
              <WheelColumn values={mins} value={m} onChange={setM} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-10 bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-10 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
