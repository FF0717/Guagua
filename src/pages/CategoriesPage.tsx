import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../store/AppContext";
import { PagePush } from "../components/PagePush";
import { IconClose } from "../components/Icons";
import { DEFAULT_CATEGORIES, UNCATEGORIZED } from "../types/day";

const DEFAULT_SET = new Set(DEFAULT_CATEGORIES);

export function CategoriesPage({ open }: { open: boolean }) {
  const {
    data,
    closePage,
    updateSettings,
    removeKnowledgeCategory,
    showToast,
  } = useApp();
  const [custom, setCustom] = useState("");
  const [marked, setMarked] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const longPressRef = useRef<{ timer: number | null; name: string | null }>({
    timer: null,
    name: null,
  });
  const suppressClickRef = useRef(false);

  const categories = useMemo(
    () => data.settings.categories.filter((c) => c !== UNCATEGORIZED),
    [data.settings.categories]
  );

  useEffect(() => {
    if (!open) {
      setCustom("");
      setMarked(null);
      setDeleting(null);
      if (longPressRef.current.timer) {
        window.clearTimeout(longPressRef.current.timer);
        longPressRef.current.timer = null;
      }
    }
  }, [open]);

  const clearLongPress = () => {
    if (longPressRef.current.timer) {
      window.clearTimeout(longPressRef.current.timer);
      longPressRef.current.timer = null;
    }
    longPressRef.current.name = null;
  };

  const startLongPress = (name: string) => {
    if (DEFAULT_SET.has(name)) return;
    clearLongPress();
    longPressRef.current.name = name;
    longPressRef.current.timer = window.setTimeout(() => {
      longPressRef.current.timer = null;
      const target = longPressRef.current.name;
      longPressRef.current.name = null;
      if (!target) return;
      suppressClickRef.current = true;
      setMarked(target);
    }, 480);
  };

  const addCategory = () => {
    const name = custom.trim().slice(0, 12);
    if (!name) {
      showToast("先输入分类名");
      return;
    }
    if (name === UNCATEGORIZED || DEFAULT_SET.has(name)) {
      showToast("这是系统分类，换个名字吧");
      return;
    }
    if (categories.includes(name)) {
      showToast("分类已存在");
      return;
    }
    updateSettings({
      categories: [...data.settings.categories.filter((c) => c !== name && c !== UNCATEGORIZED), name],
    });
    setCustom("");
    showToast(`已添加分类「${name}」`);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    removeKnowledgeCategory(deleting);
    setDeleting(null);
    setMarked(null);
    showToast(`已删除，相关知识归入「未分类」`);
  };

  return (
    <>
      <PagePush
        open={open}
        onClose={closePage}
        title="分类管理"
        layout="bar"
        zIndex={50}
        footer={
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value.slice(0, 12))}
              placeholder="添加自定义分类"
              maxLength={12}
              className="min-w-0 flex-1 rounded-[14px] border-0 bg-white px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-muted card-shadow"
            />
            <button
              type="button"
              onClick={addCategory}
              className="shrink-0 rounded-[14px] border-0 bg-[#e8e0f5] px-4 py-3 text-[14px] font-semibold text-know-ink"
            >
              添加
            </button>
          </div>
        }
      >
        <div
          onClick={() => {
            if (marked) setMarked(null);
          }}
        >
          <div className="grid grid-cols-2 gap-2.5 px-0.5 pt-1">
            {categories.map((c) => (
              <div key={c} className="relative min-w-0">
                <button
                  type="button"
                  onPointerDown={() => startLongPress(c)}
                  onPointerUp={clearLongPress}
                  onPointerLeave={clearLongPress}
                  onPointerCancel={clearLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    clearLongPress();
                    if (marked) setMarked(null);
                  }}
                  className="relative w-full select-none truncate rounded-[14px] border-0 bg-white px-2 py-3 text-center text-[14px] font-semibold text-ink card-shadow"
                >
                  {c}
                </button>
                {marked === c ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleting(c);
                    }}
                    className="absolute right-0 top-0 z-[1] flex h-5 w-5 -translate-y-1/3 translate-x-1/3 items-center justify-center rounded-full border-0 bg-[#3d3429] p-0 text-white"
                    aria-label={`删除 ${c}`}
                  >
                    <IconClose size={11} stroke="#fff" className="block shrink-0" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </PagePush>

      {deleting ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-10"
          role="dialog"
          aria-modal="true"
          aria-label="删除分类"
        >
          <button
            type="button"
            className="absolute inset-0 border-0 bg-black/30"
            aria-label="关闭"
            onClick={() => setDeleting(null)}
          />
          <div className="relative z-[1] w-full max-w-[300px] rounded-[22px] bg-white px-5 pb-5 pt-6 shadow-[0_16px_40px_rgba(60,50,30,0.18)]">
            <h2 className="mb-2 text-center text-[18px] font-bold text-ink">
              确定删除分类「{deleting}」？
            </h2>
            <p className="mb-5 text-center text-[13px] leading-relaxed text-muted">
              该分类下的知识会归到「未分类」。
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="flex-1 rounded-[14px] border-0 bg-[#F3F0EA] py-3 text-[15px] font-semibold text-ink"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-[14px] border-0 bg-[#E07070] py-3 text-[15px] font-semibold text-white"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
