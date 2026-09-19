export default function BrandMark({ compact = false, tone = "light" }: { compact?: boolean; tone?: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-3">
      <svg aria-label="Avert" viewBox="0 0 88 54" className="h-10 w-[58px] shrink-0" fill="none">
        <path d="M5 24C19 23 29 10 42 8c12-2 21 8 38 10" stroke="#8E9499" strokeWidth="6" strokeLinecap="round" />
        <path d="M5 46c15-3 25-15 34-28 2-3 6-4 9-1 9 10 17 22 32 25" stroke="#175ACB" strokeWidth="7" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span>
          <span className={`block text-[22px] font-bold tracking-[-0.035em] ${tone === "light" ? "text-white" : "text-[#15191D]"}`}>Avert</span>
          <span className={`block text-[8px] font-semibold uppercase tracking-[0.2em] ${tone === "light" ? "text-slate-500" : "text-[#69727a]"}`}>Disaster intelligence</span>
        </span>
      )}
    </div>
  );
}
