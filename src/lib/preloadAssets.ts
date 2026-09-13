/** 四个记录页右上角小鱼（体积大，进页前预热） */
export const PAGE_FISH_SRCS = [
  "/icons/page-fish.png?v=1",
  "/icons/page-fish-life.png?v=1",
  "/icons/page-fish-spend.png?v=9",
  "/icons/page-fish-journal.png?v=2",
  "/icons/page-fish-edit.png?v=1",
] as const;

const ready = new Map<string, Promise<void>>();

function warm(src: string) {
  let pending = ready.get(src);
  if (!pending) {
    pending = new Promise<void>((resolve) => {
      const img = new Image();
      const done = () => resolve();
      img.onload = () => {
        if (typeof img.decode === "function") {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      };
      img.onerror = done;
      img.src = src;
      if (img.complete && img.naturalWidth > 0) {
        if (typeof img.decode === "function") {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      }
    });
    ready.set(src, pending);
  }
  return pending;
}

/** App 启动后预加载四只记录页小鱼，避免手机上进页才开始下图 */
export function preloadPageFishImages() {
  return Promise.all(PAGE_FISH_SRCS.map((src) => warm(src)));
}

export function ensurePageFishImage(src: string) {
  return warm(src);
}
