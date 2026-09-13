import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useApp } from "../store/AppContext";
import { formatCN, todayKey } from "../lib/storage";
import type { TodoItem } from "../types/day";
import { IconBack, IconCheck, IconPlus } from "../components/Icons";
import { SwipeDeleteRow } from "../components/SwipeDeleteRow";
import { DeleteDayConfirm } from "../components/DeleteDayConfirm";
import { useSwipeBack } from "../hooks/useSwipeBack";

export function RemindersPage({ open }: { open: boolean }) {
  const { data, today, closePage, addTodo, updateTodo, toggleTodo, deleteTodo, deleteDay } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState(todayKey());
  const [draft, setDraft] = useState("");
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const todayK = today.date;
  const { panelRef, dragging, settling, dismissed } = useSwipeBack(closePage, open && entered);

  useEffect(() => {
    if (editingId) return;
    setEditingDate(todayK);
  }, [todayK, editingId]);

  const pastDays = useMemo(
    () =>
      Object.values(data.days)
        .filter((d) => d.date < todayK && d.todos.length > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.days, todayK]
  );

  useEffect(() => {
    if (open) {
      setMounted(true);
      setEntered(false);
      let id2 = 0;
      const id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        cancelAnimationFrame(id1);
        cancelAnimationFrame(id2);
      };
    }
    setEntered(false);
    setEditingId(null);
    setOpenSwipeId(null);
    setPendingDelete(null);
    const t = window.setTimeout(() => setMounted(false), dismissed ? 40 : 500);
    return () => window.clearTimeout(t);
  }, [open, dismissed]);

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (!openSwipeId) return;
    const onDown = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("[data-swipe-delete]")) return;
      if (t.closest(`[data-swipe-item="${openSwipeId}"]`)) return;
      setOpenSwipeId(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openSwipeId]);

  if (!mounted) return null;

  const startAdd = () => {
    setOpenSwipeId(null);
    const id = addTodo("");
    setEditingDate(todayK);
    setEditingId(id);
    setDraft("");
  };

  const commitEdit = () => {
    if (!editingId) return;
    const text = draft.trim();
    if (!text) deleteTodo(editingId, editingDate);
    else updateTodo(editingId, text, editingDate);
    setEditingId(null);
    setDraft("");
  };

  const beginEdit = (date: string, id: string, text: string) => {
    setOpenSwipeId(null);
    setEditingDate(date);
    setEditingId(id);
    setDraft(text);
  };

  const remove = (date: string, id: string) => {
    deleteTodo(id, date);
    if (editingId === id) {
      setEditingId(null);
      setDraft("");
    }
    setOpenSwipeId(null);
  };

  const renderDayList = (date: string, todos: TodoItem[]) => {
    const openItems = todos.filter((t) => !t.done);
    const doneItems = todos.filter((t) => t.done);
    const rows = [...openItems, ...doneItems];
    if (!rows.length) {
      return <p className="px-2 py-6 text-[15px] text-muted">还没有计划</p>;
    }
    return (
      <ul>
        {rows.map((t) => (
          <ReminderRow
            key={t.id}
            id={t.id}
            text={t.text}
            done={t.done}
            showLine={false}
            editing={editingId === t.id}
            draft={editingId === t.id ? draft : t.text}
            inputRef={editingId === t.id ? inputRef : undefined}
            swiped={openSwipeId === t.id}
            onSwipeOpen={() => setOpenSwipeId(t.id)}
            onSwipeClose={() => setOpenSwipeId((cur) => (cur === t.id ? null : cur))}
            onToggle={() => toggleTodo(t.id, date)}
            onOpen={() => beginEdit(date, t.id, t.text)}
            onDraft={setDraft}
            onCommit={commitEdit}
            onDelete={() => remove(date, t.id)}
          />
        ))}
      </ul>
    );
  };

  return (
    <div
      ref={panelRef}
      className={`page-push ${entered && !dismissed ? "page-push-in" : ""} ${
        dragging ? "page-push-dragging" : ""
      } ${settling ? "page-push-settling" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="今日计划"
    >
      <div className="relative flex h-full flex-col bg-cream">
        <header className="flex items-center justify-between px-3 safe-header-pt">
          <button
            type="button"
            onClick={closePage}
            className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-ink card-shadow"
            aria-label="返回"
          >
            <IconBack size={20} />
          </button>
          <span className="w-10" />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-28">
          <div className="px-2 pb-3 pt-4">
            <h1 className="text-[24px] font-bold leading-none text-ink">今日计划</h1>
          </div>
          {renderDayList(todayK, today.todos)}

          {pastDays.map((day) => {
            const daySwipeId = `day-${day.date}`;
            return (
              <section key={day.date} className="mt-7">
                <SwipeDeleteRow
                  id={daySwipeId}
                  open={openSwipeId === daySwipeId}
                  onOpen={() => setOpenSwipeId(daySwipeId)}
                  onClose={() => setOpenSwipeId((cur) => (cur === daySwipeId ? null : cur))}
                  onDelete={() => {
                    setOpenSwipeId(null);
                    setPendingDelete(day.date);
                  }}
                  className="mb-2.5 bg-cream"
                >
                  <h2 className="px-2 py-2.5 text-[18px] font-semibold leading-none text-ink">
                    {formatCN(day.date)}
                  </h2>
                </SwipeDeleteRow>
                {renderDayList(day.date, day.todos)}
              </section>
            );
          })}
        </div>

        <button
          type="button"
          onClick={startAdd}
          className="absolute bottom-[max(24px,calc(16px+env(safe-area-inset-bottom)))] right-5 flex h-14 w-14 items-center justify-center rounded-full border-0 bg-fish text-ink shadow-[0_8px_20px_rgba(232,178,78,0.35)]"
          aria-label="添加计划"
        >
          <IconPlus size={28} stroke="#2c2a26" />
        </button>

        <DeleteDayConfirm
          date={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onConfirm={(date) => {
            deleteDay(date);
            setOpenSwipeId(null);
          }}
        />
      </div>
    </div>
  );
}

function ReminderRow({
  id,
  text,
  done,
  showLine,
  editing,
  draft,
  inputRef,
  swiped,
  onSwipeOpen,
  onSwipeClose,
  onToggle,
  onOpen,
  onDraft,
  onCommit,
  onDelete,
}: {
  id: string;
  text: string;
  done: boolean;
  showLine?: boolean;
  editing: boolean;
  draft: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  swiped: boolean;
  onSwipeOpen: () => void;
  onSwipeClose: () => void;
  onToggle: () => void;
  onOpen: () => void;
  onDraft: (v: string) => void;
  onCommit: () => void;
  onDelete: () => void;
}) {
  const row = (
    <div className="flex items-center gap-3 bg-cream px-2 py-2.5">
      <button
        type="button"
        data-check
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-0 ${
          done ? "bg-fish" : "bg-transparent"
        }`}
        style={done ? undefined : { boxShadow: "inset 0 0 0 1.5px #d0cdc6" }}
        aria-label={done ? "标为未完成" : "完成"}
      >
        {done ? <IconCheck size={14} stroke="#fff" /> : null}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit();
            }
          }}
          placeholder=""
          className="h-6 min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] leading-6 text-ink outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className={`h-6 min-w-0 flex-1 border-0 bg-transparent p-0 text-left text-[16px] leading-6 ${
            done ? "text-muted line-through decoration-ink/25" : "text-ink"
          }`}
        >
          {text || "\u00A0"}
        </button>
      )}
    </div>
  );

  return (
    <li className={showLine ? "border-b border-line" : ""}>
      {editing ? (
        row
      ) : (
        <SwipeDeleteRow
          id={id}
          open={swiped}
          onOpen={onSwipeOpen}
          onClose={onSwipeClose}
          onDelete={onDelete}
          ignoreSelector="[data-check]"
        >
          {row}
        </SwipeDeleteRow>
      )}
    </li>
  );
}
