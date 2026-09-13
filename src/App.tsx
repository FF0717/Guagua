import { useEffect } from "react";
import { AppProvider, useApp } from "./store/AppContext";
import { TabBar } from "./components/TabBar";
import { FishDanmaku } from "./components/FishDanmaku";
import { Toast } from "./components/Toast";
import { HomePage } from "./pages/HomePage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { ReviewPage } from "./pages/ReviewPage";
import { MinePage } from "./pages/MinePage";
import { RemindersPage } from "./pages/RemindersPage";
import { JournalPage } from "./pages/JournalPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { AchievementsPage } from "./pages/AchievementsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NameOnboardModal } from "./components/NameOnboardModal";
import { Sheets } from "./sheets/Sheets";
import { preloadPageFishImages } from "./lib/preloadAssets";

function Shell() {
  const { tab, page, sheet, fishDanmaku, clearFishDanmaku, noteReturnTo } = useApp();

  useEffect(() => {
    void preloadPageFishImages();
  }, []);

  // 叠层盖住主页面时只禁交互，不隐藏，退回时底下已画好，不会整屏空白
  const overlayOpen = (page != null && page !== "loot") || sheet != null;

  return (
    <div className="phone-stage">
      <div className="phone-shell">
        <main
          className="phone-scroll safe-pb"
          aria-hidden={overlayOpen || undefined}
          style={overlayOpen ? { pointerEvents: "none" } : undefined}
        >
          {tab === "home" ? <HomePage /> : null}
          {tab === "favorites" ? <FavoritesPage /> : null}
          {tab === "review" ? <ReviewPage /> : null}
          {tab === "mine" ? <MinePage /> : null}
        </main>
        <TabBar />
        <RemindersPage open={page === "reminders"} />
        <JournalPage
          open={page === "journal" || (page === "note" && noteReturnTo === "journal")}
        />
        <CategoriesPage open={page === "categories"} />
        <AchievementsPage open={page === "achievements"} />
        <ProfilePage open={page === "profile"} />
        <Sheets />
        <NameOnboardModal />
        <Toast />
        <FishDanmaku
          key={fishDanmaku?.id ?? "empty"}
          message={fishDanmaku?.text ?? null}
          holdMs={fishDanmaku?.holdMs}
          onDone={clearFishDanmaku}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
