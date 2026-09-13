import type { SVGProps } from "react";

/** 知识卡片缩略鱼 · 配色见 categoryColor.thumbPalette */
export function ThumbFish({ size = 22, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d="M8 12c1.6-3.8 4.6-5.8 8-5.8 3.6 0 5.5 2.6 5.5 5.8s-1.9 5.8-5.5 5.8c-3.4 0-6.4-2-8-5.8z" />
      <path d="M3.5 8.5L8 12L3.5 15.5" />
      <path d="M3.5 8.5V15.5" />
      <circle cx="16.8" cy="10.3" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}
