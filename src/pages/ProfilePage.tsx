import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { parseISO } from "date-fns";
import { useApp } from "../store/AppContext";
import { PagePush } from "../components/PagePush";
import { Card } from "../components/ui";
import { DatePickerModal } from "../components/DatePickerModal";
import { IconChevron } from "../components/Icons";
import { todayKey } from "../lib/storage";
import { compressAvatarFile } from "../lib/avatar";
import { CHINA_PROVINCES, CHINA_REGION } from "../lib/chinaRegions";
import type { GenderOption } from "../types/day";

const BIRTHDAY_MIN = "1950-01-01";
const BIRTHDAY_FALLBACK = "2000-01-01";

function isDefaultFishName(name: string) {
  const n = name.trim();
  return !n || n === "Memo" || n === "小鱼";
}

function genderLabel(g: GenderOption) {
  if (g === "female") return "女";
  if (g === "male") return "男";
  return "";
}

function formatBirthday(ymd: string) {
  if (!ymd) return "";
  const d = parseISO(ymd);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatRegion(province: string, city: string) {
  if (!province) return "";
  if (!city || city === province) return province;
  return `${province} ${city}`;
}

export function ProfilePage({ open }: { open: boolean }) {
  const { data, closePage, updateSettings, showToast, showFishDanmaku } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState(data.settings.avatarDataUrl || "");
  const [displayName, setDisplayName] = useState(data.settings.displayName);
  const [userGender, setUserGender] = useState<GenderOption>(data.settings.userGender || "");
  const [userBirthday, setUserBirthday] = useState(data.settings.userBirthday || "");
  const [province, setProvince] = useState(data.settings.regionProvince || "");
  const [city, setCity] = useState(data.settings.regionCity || "");
  const [fishName, setFishName] = useState(
    isDefaultFishName(data.settings.fishName) ? "" : data.settings.fishName
  );

  const [nameOpen, setNameOpen] = useState(false);
  const [fishOpen, setFishOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAvatar(data.settings.avatarDataUrl || "");
    setDisplayName(data.settings.displayName);
    setUserGender(data.settings.userGender || "");
    setUserBirthday(data.settings.userBirthday || "");
    setProvince(data.settings.regionProvince || "");
    setCity(data.settings.regionCity || "");
    setFishName(isDefaultFishName(data.settings.fishName) ? "" : data.settings.fishName);
  }, [
    open,
    data.settings.avatarDataUrl,
    data.settings.displayName,
    data.settings.userGender,
    data.settings.userBirthday,
    data.settings.regionProvince,
    data.settings.regionCity,
    data.settings.fishName,
  ]);

  useEffect(() => {
    if (!open) {
      setNameOpen(false);
      setFishOpen(false);
      setGenderOpen(false);
      setBirthdayOpen(false);
      setRegionOpen(false);
    }
  }, [open]);

  const persist = (patch: Parameters<typeof updateSettings>[0]) => {
    updateSettings(patch);
  };

  const onPickAvatar = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await compressAvatarFile(file);
      setAvatar(dataUrl);
      persist({ avatarDataUrl: dataUrl });
      showToast("头像已更新");
    } catch {
      showToast("图片处理失败");
    }
  };

  return (
    <>
      <PagePush open={open} onClose={closePage} title="编辑信息" layout="bar" zIndex={50}>
        <div className="mb-5 flex flex-col items-center pt-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative border-0 bg-transparent p-0"
            aria-label="上传头像"
          >
            <span className="block size-[88px] overflow-hidden rounded-full bg-cream-deep">
              {avatar ? (
                <img src={avatar} alt="" className="size-full object-cover" draggable={false} />
              ) : (
                <span className="flex size-full items-center justify-center text-[13px] text-muted">
                  头像
                </span>
              )}
            </span>
            <span className="absolute bottom-0.5 right-0.5 flex size-7 items-center justify-center rounded-full bg-ink text-white shadow">
              <CameraIcon />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              void onPickAvatar(f);
            }}
          />
        </div>

        <Card className="mb-3 overflow-hidden">
          <NavRow
            label="名字"
            value={displayName}
            placeholder="填写名字"
            onClick={() => setNameOpen(true)}
          />
          <NavRow
            label="性别"
            value={genderLabel(userGender)}
            placeholder="选择性别"
            onClick={() => setGenderOpen(true)}
          />
          <NavRow
            label="生日"
            value={formatBirthday(userBirthday)}
            placeholder="选择生日"
            onClick={() => setBirthdayOpen(true)}
          />
          <NavRow
            label="地区"
            value={formatRegion(province, city)}
            placeholder="选择地区"
            onClick={() => setRegionOpen(true)}
            last
          />
        </Card>

        <Card className="mb-4 overflow-hidden">
          <NavRow
            label="小鱼名字"
            value={fishName}
            placeholder="默认 Memo"
            onClick={() => setFishOpen(true)}
            last
          />
        </Card>
      </PagePush>

      <TextEditModal
        open={nameOpen}
        title="名字"
        value={displayName}
        maxLength={12}
        placeholder="怎么称呼你"
        onCancel={() => setNameOpen(false)}
        onConfirm={(v) => {
          const next = v.trim().slice(0, 12);
          if (!next) {
            showToast("用户名必须设置");
            return;
          }
          setDisplayName(next);
          persist({ displayName: next, onboarded: true });
          setNameOpen(false);
        }}
      />

      <TextEditModal
        open={fishOpen}
        title="小鱼名字"
        value={fishName}
        maxLength={10}
        placeholder="默认 Memo"
        onCancel={() => setFishOpen(false)}
        onConfirm={(v) => {
          const next = v.trim().slice(0, 10);
          setFishName(next);
          persist({ fishName: next || "Memo" });
          setFishOpen(false);
        }}
      />

      <GenderModal
        open={genderOpen}
        value={userGender}
        onCancel={() => setGenderOpen(false)}
        onConfirm={(g) => {
          setUserGender(g);
          persist({ userGender: g });
          setGenderOpen(false);
        }}
      />

      <DatePickerModal
        open={birthdayOpen}
        value={userBirthday || BIRTHDAY_FALLBACK}
        minDate={BIRTHDAY_MIN}
        maxDate={todayKey()}
        title="选择生日"
        confirmLabel="保存"
        confirmClassName="text-fish-deep"
        onCancel={() => setBirthdayOpen(false)}
        onBlocked={() => showFishDanmaku("时间还没到呢", 1600)}
        onConfirm={(ymd) => {
          const next = ymd > todayKey() ? todayKey() : ymd;
          setUserBirthday(next);
          persist({ userBirthday: next });
          setBirthdayOpen(false);
        }}
      />

      <RegionModal
        open={regionOpen}
        province={province}
        city={city}
        onCancel={() => setRegionOpen(false)}
        onConfirm={(p, c) => {
          setProvince(p);
          setCity(c);
          persist({ regionProvince: p, regionCity: c });
          setRegionOpen(false);
        }}
      />
    </>
  );
}

function NavRow({
  label,
  value,
  placeholder,
  onClick,
  last,
}: {
  label: string;
  value: string;
  placeholder: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 w-full items-center gap-3 border-0 bg-transparent px-4 text-left ${
        last ? "" : "border-b border-line"
      }`}
    >
      <span className="shrink-0 text-[15px] text-ink">{label}</span>
      <span
        className={`min-w-0 flex-1 truncate text-right text-[15px] ${
          value ? "text-ink" : "text-muted"
        }`}
      >
        {value || placeholder}
      </span>
      <IconChevron size={16} className="shrink-0 text-muted" />
    </button>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 8.5h3.2l1.3-2h6l1.3 2H19.5A1.5 1.5 0 0 1 21 10v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V10a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CenterModalShell({
  open,
  onCancel,
  title,
  confirmLabel,
  onConfirm,
  children,
  wide,
}: {
  open: boolean;
  onCancel: () => void;
  title: string;
  confirmLabel: string;
  onConfirm: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center px-10"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/35"
        aria-label="关闭"
        onClick={onCancel}
      />
      <div
        className={`relative z-10 w-full overflow-hidden rounded-[18px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)] ${
          wide ? "max-w-[300px]" : "max-w-[280px]"
        }`}
      >
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="border-0 bg-transparent px-0.5 text-[14px] font-medium text-[#9a9690]"
          >
            取消
          </button>
          <span className="text-[14px] font-semibold text-[#6b6760]">{title}</span>
          <button
            type="button"
            onClick={onConfirm}
            className="border-0 bg-transparent px-0.5 text-[14px] font-semibold text-fish-deep"
          >
            {confirmLabel}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TextEditModal({
  open,
  title,
  value,
  maxLength,
  placeholder,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  value: string;
  maxLength: number;
  placeholder: string;
  onCancel: () => void;
  onConfirm: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <CenterModalShell
      open={open}
      onCancel={onCancel}
      title={title}
      confirmLabel="确认"
      onConfirm={() => onConfirm(draft)}
    >
      <div className="px-4 pb-4 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className="w-full rounded-[12px] border-0 bg-cream-deep px-3 py-3 text-[15px] text-ink outline-none placeholder:text-[#c8c3bb]"
          autoFocus
        />
      </div>
    </CenterModalShell>
  );
}

const GENDER_WHEEL: GenderOption[] = ["female", "male", ""];
const GENDER_WHEEL_LABEL: Record<string, string> = {
  female: "女",
  male: "男",
  "": "不显示",
};

const GENDER_ITEM_H = 36;
const GENDER_VISIBLE = 3;
const GENDER_PAD = ((GENDER_VISIBLE - 1) / 2) * GENDER_ITEM_H;
const GENDER_WHEEL_H = GENDER_ITEM_H * GENDER_VISIBLE;

function GenderModal({
  open,
  value,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  value: GenderOption;
  onCancel: () => void;
  onConfirm: (g: GenderOption) => void;
}) {
  const initial = value === "secret" ? "" : value === "female" || value === "male" ? value : "";
  const [draft, setDraft] = useState<GenderOption>(initial);
  const wheelRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = value === "secret" ? "" : value === "female" || value === "male" ? value : "";
    setDraft(next);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const el = wheelRef.current;
    if (!el || lock.current) return;
    const idx = Math.max(0, GENDER_WHEEL.indexOf(draft));
    el.scrollTop = idx * GENDER_ITEM_H;
  }, [open, draft]);

  const settle = () => {
    const el = wheelRef.current;
    if (!el) return;
    const idx = Math.max(
      0,
      Math.min(GENDER_WHEEL.length - 1, Math.round(el.scrollTop / GENDER_ITEM_H))
    );
    lock.current = true;
    el.scrollTo({ top: idx * GENDER_ITEM_H, behavior: "smooth" });
    setDraft(GENDER_WHEEL[idx]!);
    window.setTimeout(() => {
      lock.current = false;
    }, 160);
  };

  return (
    <CenterModalShell
      open={open}
      onCancel={onCancel}
      title="选择性别"
      confirmLabel="确认"
      onConfirm={() => onConfirm(draft)}
    >
      <div className="px-3 pb-3.5 pt-1">
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 rounded-[10px] bg-cream-deep"
            style={{ height: GENDER_ITEM_H }}
          />
          <div className="relative z-[2] overflow-hidden" style={{ height: GENDER_WHEEL_H }}>
            <div
              ref={wheelRef}
              className="h-full overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollSnapType: "y mandatory" }}
              onScroll={() => {
                if (timer.current) window.clearTimeout(timer.current);
                timer.current = window.setTimeout(settle, 80);
              }}
            >
              <div style={{ height: GENDER_PAD }} />
              {GENDER_WHEEL.map((id) => (
                <div
                  key={id || "none"}
                  className="flex items-center justify-center text-[15px] font-medium text-ink"
                  style={{ height: GENDER_ITEM_H, scrollSnapAlign: "center" }}
                >
                  {GENDER_WHEEL_LABEL[id]}
                </div>
              ))}
              <div style={{ height: GENDER_PAD }} />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-10 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-10 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </CenterModalShell>
  );
}

function RegionModal({
  open,
  province,
  city,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  province: string;
  city: string;
  onCancel: () => void;
  onConfirm: (province: string, city: string) => void;
}) {
  const [p, setP] = useState(province || CHINA_PROVINCES[0]!);
  const [c, setC] = useState(city);

  const cities = useMemo(() => CHINA_REGION[p] || [], [p]);

  useEffect(() => {
    if (!open) return;
    const nextP = province && CHINA_REGION[province] ? province : CHINA_PROVINCES[0]!;
    const list = CHINA_REGION[nextP] || [];
    const nextC = city && list.includes(city) ? city : list[0] || "";
    setP(nextP);
    setC(nextC);
  }, [open, province, city]);

  useEffect(() => {
    const list = CHINA_REGION[p] || [];
    if (!list.includes(c)) setC(list[0] || "");
  }, [p, c]);

  return (
    <CenterModalShell
      open={open}
      onCancel={onCancel}
      title="选择地区"
      confirmLabel="确认"
      onConfirm={() => onConfirm(p, c)}
      wide
    >
      <div className="flex max-h-[280px] gap-0 border-t border-line">
        <div className="max-h-[280px] w-[42%] overflow-y-auto border-r border-line">
          {CHINA_PROVINCES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setP(name)}
              className={`flex h-11 w-full items-center px-3 text-left text-[14px] border-0 ${
                p === name ? "bg-cream-deep font-semibold text-ink" : "bg-transparent text-ink"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="max-h-[280px] flex-1 overflow-y-auto">
          {cities.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setC(name)}
              className={`flex h-11 w-full items-center px-3 text-left text-[14px] border-0 ${
                c === name ? "bg-cream-deep font-semibold text-ink" : "bg-transparent text-ink"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </CenterModalShell>
  );
}
