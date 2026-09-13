/** 四个记录页顶部：左文案气泡 + 右侧小鱼（鱼 logo 尺寸固定） */
import { useEffect, useState } from "react";
import { ensurePageFishImage } from "../lib/preloadAssets";

export function FishPageHero({
  title,
  sub,
  textShift,
  fishSrc = "/icons/page-fish.png?v=1",
  bubbleTight,
  bubbleTighter,
  fishLarge,
  fishInset,
  fishDown,
  nudgeUp,
  noShadow,
}: {
  title: string;
  sub: string;
  /** 气泡内文字略向右挪 */
  textShift?: boolean;
  /** 右侧小鱼图，默认戴眼镜那只 */
  fishSrc?: string;
  /** 气泡右边略往左收一点 */
  bubbleTight?: boolean;
  /** 气泡右边再往左收一点（日志） */
  bubbleTighter?: boolean;
  /** 小鱼略放大（日志那只带本子显得小） */
  fishLarge?: boolean;
  /** 小鱼略往左移 */
  fishInset?: boolean;
  /** 小鱼略往下挪 */
  fishDown?: boolean;
  /** 整块（气泡+鱼）略往上 */
  nudgeUp?: boolean;
  /** 不显示脚下椭圆阴影 */
  noShadow?: boolean;
}) {
  const fishImg = fishLarge
    ? "h-[120px] max-w-[132px]"
    : "h-[104px] max-w-[116px]";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void ensurePageFishImage(fishSrc).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fishSrc]);

  return (
    <div
      className={`fish-page-hero mb-4 pt-1 ${fishLarge ? "fish-page-hero-large" : ""} ${
        nudgeUp ? "-mt-3" : ""
      }`}
    >
      <div
        className={`fish-page-bubble relative py-1 ${
          bubbleTighter
            ? "fish-page-bubble-tighter"
            : bubbleTight
              ? "fish-page-bubble-tight"
              : ""
        }`}
      >
        <div
          className={`fish-page-bubble-main relative px-3.5 py-3.5 min-[390px]:px-4 min-[390px]:py-4 ${
            textShift ? "pl-6" : ""
          }`}
        >
          <p className="fish-page-bubble-title">{title}</p>
          <p className="fish-page-bubble-sub">{sub}</p>
        </div>
        <span aria-hidden className="fish-page-tail" />
      </div>

      <div
        className={`fish-page-fish flex items-center justify-center ${
          fishDown ? "mt-1" : "-mt-3"
        }`}
      >
        {!noShadow ? (
          <span
            aria-hidden
            className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-[100%] bg-[#E8DFD4]/70 ${
              fishLarge ? "h-4 w-[76px]" : "h-3.5 w-[68px]"
            }`}
          />
        ) : null}
        <img
          src={fishSrc}
          alt=""
          width={fishLarge ? 132 : 116}
          height={fishLarge ? 120 : 104}
          decoding="async"
          fetchPriority="high"
          loading="eager"
          className={`relative z-[1] mb-1 block w-auto object-contain select-none transition-opacity duration-150 ${fishImg} ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
        />
      </div>
    </div>
  );
}
