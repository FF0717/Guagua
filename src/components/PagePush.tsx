import { useEffect, useState, type ReactNode } from "react";
import { IconBack } from "./Icons";
import { useSwipeBack } from "../hooks/useSwipeBack";

const EXIT_MS = 500;

export function PagePush({
  open,
  onClose,
  title,
  accentClass = "text-fish-deep",
  children,
  layout = "hero",
  trailing,
  footer,
  className = "",
  panelClassName = "bg-cream",
  titleClassName = "",
  zIndex = 45,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accentClass?: string;
  children: ReactNode;
  /** hero: large title below header; bar: one-line back / title / trailing */
  layout?: "hero" | "bar";
  trailing?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** 整页面板底色；知识详情可单独换色 */
  panelClassName?: string;
  /** bar 布局下中间标题的额外样式 */
  titleClassName?: string;
  /** 叠层高度；编辑等上层页需高于详情 */
  zIndex?: number;
}) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const { panelRef, dragging, settling, dismissed } = useSwipeBack(
    onClose,
    open && entered
  );

  useEffect(() => {
    if (open) {
      setMounted(true);
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
    // 右滑已在屏外：立刻卸掉，避免再播一遍退出动画闪一下
    const delay = dismissed ? 40 : EXIT_MS;
    const t = window.setTimeout(() => setMounted(false), delay);
    return () => window.clearTimeout(t);
  }, [open, dismissed]);

  if (!mounted) return null;

  const isBar = layout === "bar";

  return (
    <div
      ref={panelRef}
      className={`page-push ${entered && !dismissed ? "page-push-in" : ""} ${
        dragging ? "page-push-dragging" : ""
      } ${settling ? "page-push-settling" : ""} ${className}`.trim()}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`relative flex h-full min-h-0 flex-col overflow-hidden ${panelClassName}`}>
        <header className={`shrink-0 px-5 safe-header-pt ${panelClassName}`}>
          <div
            className={
              isBar
                ? "grid h-11 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center"
                : "flex h-11 items-center justify-between"
            }
          >
            <button
              type="button"
              onClick={onClose}
              className={`-ml-1 flex size-10 shrink-0 items-center justify-center rounded-full border-0 ${
                isBar ? "bg-transparent text-ink" : "bg-white text-ink card-shadow"
              }`}
              aria-label="返回"
            >
              <IconBack size={isBar ? 22 : 20} />
            </button>

            {isBar ? (
              <h1
                className={
                  titleClassName
                    ? `m-0 flex h-11 items-center justify-center truncate leading-none ${titleClassName}`
                    : "m-0 flex h-11 items-center justify-center truncate text-[19px] font-bold leading-none text-ink"
                }
              >
                <span className="leading-none">{title}</span>
              </h1>
            ) : null}

            <div className="flex size-10 shrink-0 items-center justify-center justify-self-end">
              {trailing ?? (isBar ? <span className="size-10" aria-hidden /> : null)}
            </div>
          </div>
        </header>

        {!isBar ? (
          <div className="px-5 pb-3 pt-3">
            <h1 className={`text-[28px] font-extrabold leading-none ${accentClass}`}>{title}</h1>
          </div>
        ) : null}

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-5 ${isBar ? "pt-3" : ""} ${
            footer ? "pb-3" : "pb-[max(24px,calc(env(safe-area-inset-bottom,0px)+16px))]"
          }`}
        >
          {children}
        </div>

        {footer ? (
          <div className="relative shrink-0 px-5 pb-[max(16px,calc(env(safe-area-inset-bottom,0px)+12px))] pt-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
