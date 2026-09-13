import { useEffect, useRef, useState } from "react";
import {
  INSPIRE_THEME_OPTIONS,
  type InspireThemeId,
} from "../lib/inspire";

const ITEM_H = 40;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;
const WHEEL_H = ITEM_H * VISIBLE;

export function ThemePickerModal({
  open,
  value,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  value: InspireThemeId;
  onCancel: () => void;
  onConfirm: (theme: InspireThemeId) => void;
}) {
  const [draft, setDraft] = useState<InspireThemeId>(value);
  const ref = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(
      0,
      INSPIRE_THEME_OPTIONS.findIndex((o) => o.id === value)
    );
    lock.current = true;
    el.scrollTop = idx * ITEM_H;
    window.setTimeout(() => {
      lock.current = false;
    }, 80);
  }, [open, value]);

  const settle = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(
      0,
      Math.min(
        INSPIRE_THEME_OPTIONS.length - 1,
        Math.round(el.scrollTop / ITEM_H)
      )
    );
    lock.current = true;
    el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    setDraft(INSPIRE_THEME_OPTIONS[idx]!.id);
    window.setTimeout(() => {
      lock.current = false;
    }, 120);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-10"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/35"
        aria-label="关闭"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-[260px] overflow-hidden rounded-[18px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="border-0 bg-transparent px-0.5 text-[14px] font-medium text-[#9a9690]"
          >
            取消
          </button>
          <span className="text-[14px] font-semibold text-[#6b6760]">选择主题</span>
          <button
            type="button"
            onClick={() => onConfirm(draft)}
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
            <div
              className="relative z-[2] overflow-hidden"
              style={{ height: WHEEL_H }}
            >
              <div
                ref={ref}
                className="h-full overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ scrollSnapType: "y mandatory" }}
                onScroll={() => {
                  if (lock.current) return;
                  if (timer.current) window.clearTimeout(timer.current);
                  timer.current = window.setTimeout(settle, 80);
                }}
              >
                <div style={{ height: PAD }} />
                {INSPIRE_THEME_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`flex items-center justify-center font-medium leading-none ${
                      opt.id === draft
                        ? "text-[17px] text-ink"
                        : "text-[16px] text-[#8a8680]"
                    }`}
                    style={{ height: ITEM_H, scrollSnapAlign: "center" }}
                  >
                    <span className="translate-y-[1px]">{opt.label}</span>
                  </div>
                ))}
                <div style={{ height: PAD }} />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-12 bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-12 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
