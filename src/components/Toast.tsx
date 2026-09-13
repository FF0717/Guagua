import { useApp } from "../store/AppContext";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[80] flex items-center justify-center px-10">
      <div className="max-w-[80%] rounded-full bg-[#2c2a26]/92 px-5 py-2.5 text-center text-[14px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
        {toast.message}
      </div>
    </div>
  );
}
