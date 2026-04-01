import { motion } from 'motion/react';
import { Settings, LogOut, ChevronRight, Bookmark } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Profile({ points }: { points: number }) {
  const stats = [
    { label: 'Total Collected', value: 142 },
    { label: 'Legendary Items', value: 3, accent: true },
    { label: 'Sentences Traded', value: 28 },
    { label: 'Days Read', value: 45 },
  ];

  return (
    <div className="flex flex-col min-h-full py-8 px-5">
      
      {/* Header Profile Area */}
      <div className="flex flex-col items-center mb-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-6"
        >
          {/* Decorative Outer Rings */}
          <div className="absolute -inset-4 border-[0.5px] border-folio-gold/20 rounded-full animate-[spin_30s_linear_infinite]" />
          <div className="absolute -inset-2 border border-folio-border-light/40 rounded-full border-dashed animate-[spin_20s_linear_infinite_reverse]" />
          
          <div className="w-24 h-24 rounded-full bg-folio-surface border border-folio-gold/50 p-1 relative z-10 overflow-hidden group">
             <div className="w-full h-full rounded-full bg-gradient-to-br from-folio-surface to-folio-bg flex items-center justify-center relative overflow-hidden">
                <span className="font-serif text-3xl text-folio-gold/80 font-light">
                  A
                </span>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <span className="text-[9px] font-sans text-white tracking-[0.2em] uppercase">Change</span>
                </div>
             </div>
          </div>
        </motion.div>

        <h2 className="font-serif text-2xl font-light tracking-[0.1em] text-folio-text mb-1.5">
          Archivist
        </h2>
        <p className="font-sans text-[10px] text-folio-text-muted/60 tracking-[0.2em] uppercase">
          Member since 2024
        </p>

        <div className="mt-6 flex items-center gap-3 px-6 py-2 border-[0.5px] border-folio-gold/30 rounded-full bg-folio-gold/5 backdrop-blur-sm">
          <span className="font-serif text-[11px] text-folio-gold/80 tracking-widest uppercase">Points</span>
          <div className="h-3 w-[1px] bg-folio-gold/40" />
          <span className="font-serif text-sm text-folio-gold font-medium">{points.toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4 border-b border-folio-border-light/30 pb-2">
           <span className="text-[10px] font-sans tracking-[0.2em] text-folio-text-muted/80 uppercase">Collection Stats</span>
           <span className="text-[10px] font-serif text-folio-gold/60 tracking-[0.1em]">✦</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 border-[0.5px] border-folio-border-light/40 rounded-sm bg-folio-surface/20 flex flex-col justify-center relative overflow-hidden group hover:border-folio-gold/30 transition-colors"
            >
              <span className={cn(
                "font-serif text-2xl font-light mb-1 relative z-10",
                stat.accent ? "text-folio-gold" : "text-folio-text"
              )}>
                {stat.value}
              </span>
              <span className="font-sans text-[9px] text-folio-text-muted/60 tracking-[0.15em] uppercase relative z-10">
                {stat.label}
              </span>
              {/* Hover effect background */}
              <div className="absolute inset-0 bg-gradient-to-br from-folio-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-2">
        {[
          { icon: Bookmark, label: 'Saved Highlights', path: '#' },
          { icon: Settings, label: 'Preferences', path: '#' },
          { icon: LogOut, label: 'Sign Out', path: '#', danger: true },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center justify-between p-4 border-[0.5px] border-transparent rounded-sm transition-all duration-300 group",
                item.danger 
                  ? "hover:bg-red-950/20 hover:border-red-900/30 hover:text-red-400" 
                  : "hover:bg-folio-surface/40 hover:border-folio-border-light/50"
              )}
            >
              <div className="flex items-center gap-4">
                <Icon size={16} strokeWidth={1.5} className={cn(
                  "opacity-60 group-hover:opacity-100 transition-opacity",
                  item.danger ? "text-red-400" : "text-folio-gold"
                )} />
                <span className={cn(
                  "font-sans text-[11px] tracking-[0.15em] uppercase",
                  item.danger ? "text-red-400/80 group-hover:text-red-400" : "text-folio-text-muted group-hover:text-folio-text"
                )}>
                  {item.label}
                </span>
              </div>
              <ChevronRight size={14} strokeWidth={1} className="text-folio-text-muted/40 group-hover:translate-x-1 transition-transform" />
            </button>
          );
        })}
      </div>

      {/* Footer Branding */}
      <div className="mt-auto pt-12 pb-4 flex flex-col items-center justify-center opacity-40">
        <span className="font-serif text-lg tracking-[0.4em] text-folio-gold/80 font-thin mb-2">FOLIO</span>
        <div className="flex items-center gap-2">
           <div className="w-4 h-[1px] bg-folio-text-muted/30" />
           <span className="font-sans text-[8px] tracking-[0.3em] uppercase text-folio-text-muted/60">v1.0.0</span>
           <div className="w-4 h-[1px] bg-folio-text-muted/30" />
        </div>
      </div>

    </div>
  );
}