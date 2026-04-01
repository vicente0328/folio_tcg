import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark, Settings, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

const EASE = [0.25, 0.1, 0.25, 1] as const;

const MENU = [
  { icon: Bookmark, label: '저장된 문장', danger: false },
  { icon: Settings, label: '설정', danger: false },
  { icon: LogOut, label: '로그아웃', danger: true },
];

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
  points: number;
  collectionCount: number;
  legendaryCount: number;
}

export default function ProfilePanel({ open, onClose, points, collectionCount, legendaryCount }: ProfilePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-folio-bg border-b border-folio-border-light/40"
          >
            <div className="px-6 pt-6 pb-8">
              {/* Close */}
              <button onClick={onClose} className="absolute top-4 right-4 text-folio-text-muted/30 hover:text-folio-text-muted/60 transition-colors">
                <X size={18} strokeWidth={1.2} />
              </button>

              {/* Avatar & Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-folio-surface border border-folio-gold/25 flex items-center justify-center shrink-0">
                  <span className="font-serif text-xl text-folio-gold/60 font-light">A</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-light tracking-[0.12em] text-folio-text">Archivist</h3>
                  <p className="font-serif text-[9px] text-folio-text-muted/35 tracking-[0.25em] uppercase mt-0.5">애서가 · Bibliophile</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 py-2.5 text-center border border-folio-border-light/30 rounded-[2px] bg-folio-surface/15">
                  <span className="block font-serif text-sm text-folio-gold font-medium">{points.toLocaleString()}</span>
                  <span className="font-serif text-[7px] text-folio-text-muted/30 tracking-[0.2em] uppercase">Points</span>
                </div>
                <div className="flex-1 py-2.5 text-center border border-folio-border-light/30 rounded-[2px] bg-folio-surface/15">
                  <span className="block font-serif text-sm text-folio-text font-medium">{collectionCount}</span>
                  <span className="font-serif text-[7px] text-folio-text-muted/30 tracking-[0.2em] uppercase">Collected</span>
                </div>
                <div className="flex-1 py-2.5 text-center border border-folio-border-light/30 rounded-[2px] bg-folio-surface/15">
                  <span className="block font-serif text-sm text-folio-gold font-medium">{legendaryCount}</span>
                  <span className="font-serif text-[7px] text-folio-text-muted/30 tracking-[0.2em] uppercase">Legendary</span>
                </div>
              </div>

              {/* Divider */}
              <div className="ornament-line-gold mb-4" />

              {/* Menu */}
              <div className="space-y-0.5">
                {MENU.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-3 rounded-[2px] transition-all duration-400 group",
                        item.danger ? "hover:bg-red-950/15" : "hover:bg-folio-surface/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={14} strokeWidth={1.2}
                          className={cn("opacity-40", item.danger ? "text-red-400/80" : "text-folio-gold")} />
                        <span className={cn(
                          "font-serif text-[10px] tracking-[0.15em] uppercase",
                          item.danger ? "text-red-400/50" : "text-folio-text-muted/50"
                        )}>{item.label}</span>
                      </div>
                      <ChevronRight size={12} strokeWidth={1} className="text-folio-text-muted/20" />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
