import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  tall?: boolean;
  zIndex?: number;
}

const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 0.55;

export function BottomSheet({
  open,
  onClose,
  title,
  leading,
  trailing,
  children,
  tall,
  zIndex = 50,
}: Props) {
  const startY = useRef(0);
  const startT = useRef(0);
  const dragging = useRef(false);
  const [offsetY, setOffsetY] = useState(0);
  const [draggingNow, setDraggingNow] = useState(false);

  if (!open) return null;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragging.current = true;
    startY.current = e.clientY;
    startT.current = Date.now();
    setDraggingNow(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dy = Math.max(0, e.clientY - startY.current);
    setOffsetY(dy);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    setDraggingNow(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const dy = Math.max(0, e.clientY - startY.current);
    const dt = Math.max(1, Date.now() - startT.current);
    const velocity = dy / dt;
    if (dy >= DISMISS_DISTANCE || velocity >= DISMISS_VELOCITY) {
      setOffsetY(0);
      onClose();
      return;
    }
    setOffsetY(0);
  };

  return (
    <div className="absolute inset-0 flex items-end justify-center" style={{ zIndex }}>
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/25"
        aria-label="关闭"
        onClick={onClose}
        style={{ opacity: offsetY ? Math.max(0.08, 1 - offsetY / 320) : 1 }}
      />
      <div
        className={`relative z-10 w-full overflow-x-hidden rounded-t-[28px] bg-white px-5 pb-[calc(18px+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] ${
          tall ? "max-h-[92%]" : "max-h-[85%]"
        } overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        style={{
          transform: `translateY(${offsetY}px)`,
          transition: draggingNow ? "none" : "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          className="mx-auto -mt-1 mb-2 flex w-full cursor-grab touch-none flex-col items-center pb-2 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="mt-1 h-1.5 w-10 rounded-full bg-black/10" />
        </div>
        {title ? (
          <div className="relative mb-4 flex min-h-8 items-center justify-center">
            {leading ? (
              <div className="absolute left-0 top-1/2 z-[1] -translate-y-1/2">{leading}</div>
            ) : null}
            <h2 className="text-center text-[18px] font-bold text-ink">{title}</h2>
            {trailing ? (
              <div className="absolute right-0 top-1/2 z-[1] -translate-y-1/2">{trailing}</div>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
