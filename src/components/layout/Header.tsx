type HeaderProps = {
  title: string;
  subtitle?: string;
  unreadNotifications?: number;
};

export function Header({ title, subtitle, unreadNotifications = 0 }: HeaderProps) {
  return (
    <div className="mb-10 border-b border-white/[0.05] pb-8 pt-2 relative">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{title}</h1>
          {subtitle && <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{subtitle}</p>}
        </div>
        {unreadNotifications > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              {unreadNotifications} ACTIVE ALERTS
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
