import type { ReactNode } from "react";
import { useApp } from "../store/AppContext";
import { companionDays, dayHasLeft, resolveFishName } from "../lib/storage";
import { Card } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import {
  IconBell,
  IconChevron,
  IconExport,
  IconGear,
  IconHeart,
  IconImport,
  IconInfo,
  IconPalette,
  IconTags,
  IconUser,
} from "../components/Icons";

export function MinePage() {
  const { data, today, openPage, showToast, showFishDanmaku } = useApp();
  const days = companionDays(data.settings.startedAt);
  const fishLabel = resolveFishName(data.settings.fishName);
  const statusLine = dayHasLeft(today)
    ? `${fishLabel}状态很好，继续保持吧！`
    : `今天过得怎么样呀，可以分享给${fishLabel}`;
  const comingSoon = () => showFishDanmaku("功能正在开发中");

  return (
    <div className="mx-auto max-w-[430px] px-4">
      <PageHeader
        title="我的"
        subtitle={`${fishLabel}已陪伴你${days}天`}
      />

      <Card className="mb-4 flex min-h-[160px] flex-col items-center justify-center px-5 py-6 text-center">
        <img
          src="/icons/home-fish.png"
          alt=""
          width={96}
          height={72}
          className="mb-3 block h-[72px] w-auto select-none object-contain"
          draggable={false}
        />
        <strong className="text-[16px] font-semibold text-ink">{fishLabel}</strong>
        <p className="mt-1 text-[12px] text-muted">{statusLine}</p>
      </Card>

      <Card className="mb-3 overflow-hidden">
        <Row
          icon={<IconHeart size={20} />}
          label="我的成就"
          onClick={() => openPage("achievements")}
        />
      </Card>

      <p className="mb-2 px-1 text-[12px] text-muted">数据管理</p>
      <Card className="mb-3 overflow-hidden">
        <Row icon={<IconExport size={20} />} label="导出备份" onClick={comingSoon} />
        <Row icon={<IconImport size={20} />} label="导入数据" onClick={comingSoon} />
      </Card>

      <p className="mb-2 px-1 text-[12px] text-muted">个性设置</p>
      <Card className="mb-3 overflow-hidden">
        <Row
          icon={<IconUser size={20} />}
          label="编辑信息"
          onClick={() => openPage("profile")}
        />
        <Row
          icon={<IconTags size={20} />}
          label="分类管理"
          onClick={() => openPage("categories")}
        />
        <Row icon={<IconBell size={20} />} label="提醒设置" onClick={comingSoon} />
        <Row icon={<IconPalette size={20} />} label="主题与显示" onClick={comingSoon} />
        <Row icon={<IconGear size={20} />} label="偏好设置" onClick={comingSoon} />
      </Card>

      <Card className="mb-4 overflow-hidden">
        <Row icon={<IconInfo size={20} />} label="关于摸摸鱼" hint="版本 1.0.0" onClick={() => showToast("摸摸鱼 · 私人手账")} />
      </Card>
    </div>
  );
}

function Row({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-full items-center gap-3 border-0 border-b border-line bg-transparent px-4 text-left last:border-b-0"
    >
      <span className="inline-flex shrink-0 text-ink" aria-hidden>
        {icon}
      </span>
      <strong className="flex-1 text-[15px] font-medium text-ink">{label}</strong>
      {hint ? <span className="text-[13px] text-muted">{hint}</span> : null}
      <IconChevron size={16} className="text-muted" />
    </button>
  );
}
