import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

const DELETE_W = 80;

export function SwipeDeleteRow({
  id,
  open,
  onOpen,
  onClose,
  onDelete,
  children,
  className = "",
  deleteLabel = "删除",
  ignoreSelector,
}: {
  id: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
  children: ReactNode;
  className?: string;
  deleteLabel?: string;
  ignoreSelector?: string;
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const swiping = useRef(false);
  const suppressClick = useRef(false);
  const dragXRef = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const x = open ? -DELETE_W : 0;
    dragXRef.current = x;
    setDragX(x);
  }, [open]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-swipe-delete]")) return;
    if (ignoreSelector && target.closest(ignoreSelector)) return;
    tracking.current = true;
    swiping.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setBusy(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!tracking.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!swiping.current) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        tracking.current = false;
        setBusy(false);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }
      swiping.current = true;
      suppressClick.current = true;
    }
    const base = open ? -DELETE_W : 0;
    const next = Math.min(0, Math.max(-DELETE_W, base + dx));
    dragXRef.current = next;
    setDragX(next);
  };

  const endPointer = (e: PointerEvent<HTMLDivElement>) => {
    if (!tracking.current) return;
    tracking.current = false;
    setBusy(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (swiping.current) {
      suppressClick.current = true;
      const x = dragXRef.current;
      if (x < -DELETE_W / 2) {
        dragXRef.current = -DELETE_W;
        setDragX(-DELETE_W);
        onOpen();
      } else {
        dragXRef.current = 0;
        setDragX(0);
        onClose();
      }
      swiping.current = false;
    }
  };

  return (
    <div data-swipe-item={id} className="relative overflow-hidden">
      <div
        className={`flex ${busy ? "" : "transition-transform duration-200"}`}
        style={{ transform: `translateX(${dragX}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest("[data-swipe-delete]")) return;
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
            return;
          }
          if (open) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <div className={`w-full min-w-full shrink-0 ${className}`}>{children}</div>
        <div
          className="relative flex shrink-0 items-center justify-center self-stretch"
          style={{ width: DELETE_W, minWidth: DELETE_W }}
        >
          <button
            type="button"
            data-swipe-delete
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="mx-1.5 flex h-[calc(100%-10px)] min-h-[36px] w-[68px] items-center justify-center rounded-[14px] border-0 bg-[#E07070] text-[15px] font-semibold text-white"
            aria-label={deleteLabel}
          >
            {deleteLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
