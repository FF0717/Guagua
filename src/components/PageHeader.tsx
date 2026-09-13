import type { ReactNode } from "react";

/** 知识 / 回顾 / 我的 页顶栏：字号、间距、小标题色统一 */
export function PageHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle: ReactNode;
  /** 小标题行右侧操作（筛选、年月切换等） */
  trailing?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-2 bg-cream px-4 pb-2 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
      <h1 className="mb-3 text-[28px] font-semibold leading-none text-ink">{title}</h1>
      <div className="flex h-8 items-center justify-between gap-3">
        <div className="min-w-0 text-[15px] font-medium leading-none text-[#A39E96]">
          {subtitle}
        </div>
        {trailing ? <div className="flex shrink-0 items-center gap-0.5">{trailing}</div> : null}
      </div>
    </header>
  );
}
