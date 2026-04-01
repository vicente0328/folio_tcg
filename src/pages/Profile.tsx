import { motion } from 'motion/react';
import { Settings, LogOut, Bookmark, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

const STATS = [
  { label: 'Total Collected', value: 142, accent: false },
  { label: 'Legendary', value: 3, accent: true },
  { label: 'Traded', value: 28, accent: false },
  { label: 'Days Active', value: 45, accent: false },
];

const MENU = [
  { icon: Bookmark, label: '저장된 문장', danger: false },
  { icon: Settings, label: '설정', danger: false },
  { icon: LogOut, label: '로그아웃', danger: true },
];

export default function Profile({ points }: { points: number }) {
  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-4">

      {/* ── Avatar & Name ── */}
      <div className="flex flex-col items-center mb-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative mb-5"
        >
          {/* Decorative rings */}
          <div className="absolute -inset-5 border-[0.5px] border-folio-gold/10 rounded-full animate-[rotateSlowCW_40s_linear_infinite]" />
          <div className="absolute -inset-3 border-[0.5px] border-folio-border-light/25 rounded-full border-dashed animate-[rotateSlowCCW_25s_linear_infinite]" />

          <div className="w-20 h-20 rounded-full bg-folio-surface border border-folio-gold/30 flex items-center justify-center relative z-10 overflow-hidden group cursor-pointer">
            <span className="font-serif text-2xl text-folio-gold/70 font-light">A</span>
            <div className="absolute inset-0 bg-folio-bg/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="font-serif text-[8px] text-folio-text/60 tracking-[0.2em] uppercase">변경</span>
            </div>
          </div>
        </motion.div>

        <h2 className="font-serif text-xl font-light tracking-[0.15em] text-folio-text mb-1">Archivist</h2>
        <p className="font-serif text-[9px] text-folio-text-muted/40 tracking-[0.3em] uppercase">Member since 2024</p>

        {/* Points badge */}
        <div className="mt-5 flex items-center gap-2 px-4 py-1.5 border-[0.5px] border-folio-gold/20 rounded-full bg-folio-gold/[0.03]">
          <span className="font-serif text-[10px] text-folio-gold/60 tracking-[0.2em] uppercase">Points</span>
          <div className="w-[0.5px] h-3 bg-folio-gold/20" />
          <span className="font-serif text-sm text-folio-gold font-medium">{points.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[10px] text-folio-text-muted/40 tracking-[0.25em] uppercase">Collection Stats</span>
          <span className="text-folio-gold/20 text-[8px]">&#10043;</span>
        </div>
        <div className="ornament-line mb-4" />

        <div className="grid grid-cols-2 gap-3">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="p-4 border-[0.5px] border-folio-border-light/35 rounded-[2px] bg-folio-surface/15 group hover:border-folio-gold/15 transition-colors duration-500"
            >
              <span className={cn(
                "block font-serif text-[1.4rem] font-light mb-0.5",
                stat.accent ? "text-folio-gold" : "text-folio-text"
              )}>
                {stat.value}
              </span>
              <span className="font-serif text-[8px] text-folio-text-muted/40 tracking-[0.2em] uppercase">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Menu ── */}
      <div className="space-y-1 mb-8">
        {MENU.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-[2px] transition-all duration-400 group",
                item.danger
                  ? "hover:bg-red-950/15"
                  : "hover:bg-folio-surface/30"
              )}
            >
              <div className="flex items-center gap-3.5">
                <Icon
                  size={15}
                  strokeWidth={1.3}
                  className={cn(
                    "opacity-40 group-hover:opacity-70 transition-opacity",
                    item.danger ? "text-red-400/80" : "text-folio-gold"
                  )}
                />
                <span className={cn(
                  "font-serif text-[11px] tracking-[0.15em] uppercase",
                  item.danger
                    ? "text-red-400/50 group-hover:text-red-400/70"
                    : "text-folio-text-muted/50 group-hover:text-folio-text-muted/80"
                )}>
                  {item.label}
                </span>
              </div>
              <ChevronRight
                size={13}
                strokeWidth={1}
                className="text-folio-text-muted/20 group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          );
        })}
      </div>

      {/* ── Footer Brand ── */}
      <div className="mt-auto pt-8 pb-2 flex flex-col items-center opacity-25">
        <span className="font-serif text-base tracking-[0.5em] text-folio-gold/70 font-light">FOLIO</span>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="w-3 h-[0.5px] bg-folio-text-muted/30" />
          <span className="font-serif text-[7px] tracking-[0.3em] uppercase text-folio-text-muted/40">v1.0.0</span>
          <div className="w-3 h-[0.5px] bg-folio-text-muted/30" />
        </div>
      </div>
    </div>
  );
}
