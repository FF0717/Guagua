import { useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";

const LONG_MS = 480;

/** 短按走 onClick；长按走 onLongPress（并抑制随后的 click） */
export function LongPressable({
  onClick,
  onLongPress,
  className = "",
  children,
  disabled,
}: {
  onClick?: () => void;
  onLongPress: () => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  const timer = useRef<number | null>(null);
  const longFired = useRef(false);

  const clear = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled || e.button !== 0) return;
    longFired.current = false;
    clear();
    timer.current = window.setTimeout(() => {
      longFired.current = true;
      timer.current = null;
      onLongPress();
    }, LONG_MS);
  };

  const onPointerUp = () => clear();
  const onPointerCancel = () => clear();
  const onPointerLeave = () => clear();

  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      onClick={() => {
        if (longFired.current) {
          longFired.current = false;
          return;
        }
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}
