/** Home header companion: 右侧小鱼插画（纯展示，不可点） */
export function FishHero({
  className = "",
  src = "/icons/home-fish.png",
}: {
  className?: string;
  /** 默认睁眼小鱼；夜深了可换困鱼 */
  src?: string;
}) {
  return (
    <div
      className={`pointer-events-none relative flex h-[96px] w-[120px] shrink-0 items-center justify-center ${className}`.trim()}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        width={120}
        height={88}
        className="block h-[88px] w-auto max-w-[120px] object-contain select-none"
        draggable={false}
      />
    </div>
  );
}
