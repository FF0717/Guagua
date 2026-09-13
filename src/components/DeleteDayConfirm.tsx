import { formatCN } from "../lib/storage";

export function DeleteDayConfirm({
  date,
  onClose,
  onConfirm,
}: {
  date: string | null;
  onClose: () => void;
  onConfirm: (date: string) => void;
}) {
  if (!date) return null;
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center px-10" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/30"
        aria-label="关闭"
        onClick={onClose}
      />
      <div className="relative z-[1] w-full max-w-[300px] rounded-[22px] bg-white px-5 pb-5 pt-6 shadow-[0_16px_40px_rgba(60,50,30,0.18)]">
        <h2 className="mb-2 text-center text-[18px] font-bold text-ink">删除这一天？</h2>
        <p className="mb-5 text-center text-[13px] leading-relaxed text-muted">
          将清除{formatCN(date)}的记录，删除后无法恢复。
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[14px] border-0 bg-cream-deep py-3 text-[15px] font-medium text-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(date);
              onClose();
            }}
            className="flex-1 rounded-[14px] border-0 bg-[#E07070] py-3 text-[15px] font-semibold text-white"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
