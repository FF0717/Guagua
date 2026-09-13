import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 左缘右滑返回（跟微信）：跟手、锁竖滑；约 1/3 屏或轻甩才关。
 */
const EDGE_PX = 52;
const LOCK_RIGHT = 8;
const ABANDON_UP = 16;
/** 大拇指弧线滑通常只到左约 1/3，按此关页 */
const CLOSE_RATIO = 0.33;
const CLOSE_PX_MIN = 110;
const FLICK_VELOCITY = 0.5;
const FLICK_MIN_X = 48;

export function useSwipeBack(onClose: () => void, enabled = true) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const [phase, setPhase] = useState<"idle" | "dragging" | "settling">("idle");
  const [dismissed, setDismissed] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const dismissedRef = useRef(false);

  const setPanelRef = useCallback((node: HTMLElement | null) => {
    setPanel(node);
  }, []);

  useEffect(() => {
    if (enabled) {
      dismissedRef.current = false;
      setDismissed(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!panel || !enabled) return;
    const el = panel;

    let tracking = false;
    let locked = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let dragX = 0;
    let settleTimer = 0;
    let pointerId: number | null = null;

    const freezeScroll = () => {
      el.style.touchAction = "none";
      el.classList.add("page-push-dragging");
      el.querySelectorAll<HTMLElement>(".overflow-y-auto").forEach((node) => {
        node.dataset.swipeBackY = String(node.scrollTop);
        node.style.overflow = "hidden";
        node.style.touchAction = "none";
      });
    };

    const unfreezeScroll = () => {
      el.style.touchAction = "";
      el.classList.remove("page-push-dragging");
      el.querySelectorAll<HTMLElement>("[data-swipe-back-y]").forEach((node) => {
        const y = Number(node.dataset.swipeBackY || 0);
        node.style.overflow = "";
        node.style.touchAction = "";
        delete node.dataset.swipeBackY;
        node.scrollTop = y;
      });
    };

    const clearInlineMotion = () => {
      el.style.transition = "";
      el.style.transform = "";
    };

    const applyDrag = (x: number) => {
      dragX = Math.max(0, x);
      el.style.transition = "none";
      el.style.transform = `translateX(${dragX}px)`;
    };

    const detachDoc = () => {
      document.removeEventListener("touchmove", onTouchMoveDoc);
      document.removeEventListener("touchend", onTouchEndDoc);
      document.removeEventListener("touchcancel", onTouchEndDoc);
      document.removeEventListener("pointermove", onPointerMoveDoc);
      document.removeEventListener("pointerup", onPointerUpDoc);
      document.removeEventListener("pointercancel", onPointerUpDoc);
    };

    const onTouchMoveDoc = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      onMove(e.touches[0].clientX, e.touches[0].clientY, e);
    };
    const onTouchEndDoc = () => onEnd();
    const onPointerMoveDoc = (e: PointerEvent) => {
      if (pointerId != null && e.pointerId !== pointerId) return;
      onMove(e.clientX, e.clientY, e);
    };
    const onPointerUpDoc = (e: PointerEvent) => {
      if (pointerId != null && e.pointerId !== pointerId) return;
      onEnd();
    };

    const onStart = (clientX: number, clientY: number, target: EventTarget | null) => {
      if (phaseRef.current === "settling" || dismissedRef.current) return;
      if (clientX > EDGE_PX) return;
      const t = target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [data-no-swipe-back]")) return;

      tracking = true;
      locked = false;
      startX = clientX;
      startY = clientY;
      lastX = clientX;
      lastT = performance.now();
      velocity = 0;
      dragX = 0;
    };

    const onMove = (clientX: number, clientY: number, e: Event) => {
      if (!tracking) return;

      const dx = clientX - startX;
      const dy = clientY - startY;
      const ady = Math.abs(dy);

      if (!locked) {
        if (ady >= ABANDON_UP && ady > Math.abs(dx) * 1.2 && dx < LOCK_RIGHT) {
          tracking = false;
          detachDoc();
          return;
        }
        if (dx < LOCK_RIGHT) return;

        locked = true;
        freezeScroll();
        setPhase("dragging");
      }

      e.preventDefault();
      const now = performance.now();
      const dt = Math.max(8, now - lastT);
      velocity = (clientX - lastX) / dt;
      lastX = clientX;
      lastT = now;
      applyDrag(dx);
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      detachDoc();
      pointerId = null;

      if (!locked) return;
      locked = false;

      const width = window.innerWidth || 390;
      const need = Math.max(CLOSE_PX_MIN, width * CLOSE_RATIO);
      const flick = velocity >= FLICK_VELOCITY && dragX >= FLICK_MIN_X;
      const shouldClose = dragX >= need || flick;

      unfreezeScroll();

      if (shouldClose) {
        setPhase("settling");
        el.classList.add("page-push-settling");
        el.style.transition = "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = `translateX(${width}px)`;
        settleTimer = window.setTimeout(() => {
          // 标记已右滑退出：React 不再加回 page-push-in；cleanup 也不清 transform
          dismissedRef.current = true;
          setDismissed(true);
          el.classList.remove("page-push-in", "page-push-settling");
          el.style.transition = "none";
          el.style.transform = "translateX(100%)";
          setPhase("idle");
          onCloseRef.current();
        }, 230);
        return;
      }

      setPhase("settling");
      el.classList.add("page-push-settling");
      el.style.transition = "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "translateX(0px)";
      settleTimer = window.setTimeout(() => {
        el.classList.remove("page-push-settling");
        clearInlineMotion();
        setPhase("idle");
      }, 260);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      onStart(touch.clientX, touch.clientY, e.target);
      if (!tracking) return;
      document.addEventListener("touchmove", onTouchMoveDoc, { passive: false });
      document.addEventListener("touchend", onTouchEndDoc);
      document.addEventListener("touchcancel", onTouchEndDoc);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (e.button !== 0) return;
      onStart(e.clientX, e.clientY, e.target);
      if (!tracking) return;
      pointerId = e.pointerId;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      document.addEventListener("pointermove", onPointerMoveDoc);
      document.addEventListener("pointerup", onPointerUpDoc);
      document.addEventListener("pointercancel", onPointerUpDoc);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.clearTimeout(settleTimer);
      detachDoc();
      unfreezeScroll();
      // 右滑关页时保留 translateX(100%)，避免清掉后弹回 0 再闪一下
      if (!dismissedRef.current) {
        clearInlineMotion();
        el.classList.remove("page-push-settling");
      }
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, [panel, enabled]);

  return {
    panelRef: setPanelRef,
    dragging: phase === "dragging",
    settling: phase === "settling",
    dismissed,
  };
}
