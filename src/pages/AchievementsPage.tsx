import { useMemo } from "react";
import { useApp } from "../store/AppContext";
import { PagePush } from "../components/PagePush";
import { Card } from "../components/ui";
import { companionDays, dayHasLeft, dayStats, formatMinutes, formatMoney, resolveFishName } from "../lib/storage";

export function AchievementsPage({ open }: { open: boolean }) {
  const { data, closePage } = useApp();
  const days = companionDays(data.settings.startedAt);
  const fishName = resolveFishName(data.settings.fishName);

  const stats = useMemo(() => {
    let knowledge = 0;
    let journal = 0;
    let highlights = 0;
    let lifeMins = 0;
    let spend = 0;
    let activeDays = 0;
    for (const day of Object.values(data.days)) {
      knowledge += day.knowledge.length;
      if (day.shortNote.trim() || day.journal.trim()) journal += 1;
      if (day.highlight) highlights += 1;
      const s = dayStats(day);
      lifeMins += s.lifeTotal;
      spend += s.spendTotal;
      if (dayHasLeft(day)) activeDays += 1;
    }
    return { knowledge, journal, highlights, lifeMins, spend, activeDays };
  }, [data.days]);

  const rows = [
    { label: "陪伴天数", value: `${days} 天` },
    { label: "留下痕迹的日子", value: `${stats.activeDays} 天` },
    { label: "小发现", value: `${stats.knowledge} 条` },
    { label: "日志", value: `${stats.journal} 篇` },
    { label: "高光日", value: `${stats.highlights} 天` },
    { label: "生活时长", value: formatMinutes(stats.lifeMins).replace(/\s/g, "") },
    { label: "花费合计", value: formatMoney(stats.spend) },
  ];

  return (
    <PagePush open={open} onClose={closePage} title="我的成就" layout="bar" zIndex={50}>
      <Card className="mb-4 px-5 py-5 text-center">
        <img
          src="/icons/home-fish.png"
          alt=""
          width={88}
          height={66}
          className="mx-auto mb-3 block h-[66px] w-auto select-none object-contain"
          draggable={false}
        />
        <p className="text-[15px] font-semibold text-ink">
          {fishName}和你一起留下了这些
        </p>
      </Card>

      <Card className="overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex h-14 items-center justify-between border-b border-line px-4 last:border-b-0"
          >
            <span className="text-[15px] text-ink">{row.label}</span>
            <span className="text-[15px] font-semibold tabular-nums text-ink">{row.value}</span>
          </div>
        ))}
      </Card>
    </PagePush>
  );
}
