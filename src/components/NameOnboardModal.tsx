import { useEffect, useState } from "react";
import { useApp } from "../store/AppContext";

const MAX_LEN = 12;

/** 首次使用：必须设置用户名才能继续 */
export function NameOnboardModal() {
  const { data, updateSettings, showToast } = useApp();
  const needsName = !(data.settings.displayName || "").trim();
  const [draft, setDraft] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (needsName) {
      setDraft("");
      setShake(false);
    }
  }, [needsName]);

  if (!needsName) return null;

  const confirm = () => {
    const next = draft.trim().slice(0, MAX_LEN);
    if (!next) {
      setShake(false);
      // 下一帧再开，保证连续点也能重新播动画
      requestAnimationFrame(() => setShake(true));
      showToast("先起个名字再继续吧");
      return;
    }
    updateSettings({ displayName: next, onboarded: true });
  };

  return (
    <div
      className="absolute inset-0 z-[90] flex items-center justify-center px-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-onboard-title"
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="relative z-10 w-full max-w-[300px] overflow-hidden rounded-[20px] bg-white px-5 pb-5 pt-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)]">
        <h2
          id="name-onboard-title"
          className="text-center text-[18px] font-semibold tracking-[0.02em] text-ink"
        >
          很高兴认识你！
        </h2>
        <p className="mt-2 text-center text-[13px] leading-[1.5] text-muted">
          我叫Memo，你叫什么名字呀～
        </p>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
          maxLength={MAX_LEN}
          placeholder="输入你的名字"
          className={`mt-5 w-full rounded-[12px] border-0 bg-cream-deep px-3 py-3 text-[15px] text-ink outline-none placeholder:text-[#c8c3bb] ${
            shake ? "name-onboard-input-shake" : ""
          }`}
          autoFocus
          enterKeyHint="done"
          onAnimationEnd={() => setShake(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirm();
          }}
        />
        <button
          type="button"
          onClick={confirm}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-[12px] border-0 bg-fish-deep text-[15px] font-semibold text-white"
        >
          开始使用
        </button>
      </div>
    </div>
  );
}
