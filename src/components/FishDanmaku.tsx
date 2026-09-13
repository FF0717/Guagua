import { useEffect, useState } from "react";

type Props = {
  message: string | null;
  holdMs?: number;
  onDone: () => void;
};

export function FishDanmaku({ message, holdMs = 2000, onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (!message) return;
    setPhase("in");
    const outMs = 350;
    const hide = window.setTimeout(() => setPhase("out"), holdMs);
    const done = window.setTimeout(onDone, holdMs + outMs);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(done);
    };
  }, [message, holdMs, onDone]);

  if (!message) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[85] flex items-center justify-center px-8">
      <div
        className={`fish-danmaku max-w-[85%] rounded-full bg-[#5C5348]/90 px-5 py-2.5 text-center text-[15px] font-medium text-[#FFF8F0] shadow-[0_8px_28px_rgba(90,70,40,0.18)] ${
          phase === "in" ? "fish-danmaku-in" : "fish-danmaku-out"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
