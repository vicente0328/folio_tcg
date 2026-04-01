import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { BOOK_AUTHORS } from '../data/cards';

interface FolioCardProps {
  card: any;
  className?: string;
  onClick?: () => void;
  compact?: boolean;
}

const RARITY = {
  Legendary: {
    card: 'card-legendary',
    accent: '#c4a24d',
    muted: 'rgba(196,162,77,0.25)',
    faint: 'rgba(196,162,77,0.06)',
    label: 'LEGENDARY',
    labelColor: 'text-[#c4a24d]',
    dot: 'bg-[#c4a24d] shadow-[0_0_6px_#c4a24d]',
    ribbon: 'from-[#c4a24d] to-[#8a6d1c]',
  },
  Epic: {
    card: 'card-epic',
    accent: '#c76d8a',
    muted: 'rgba(199,109,138,0.25)',
    faint: 'rgba(199,109,138,0.06)',
    label: 'EPIC',
    labelColor: 'text-[#c76d8a]',
    dot: 'bg-[#9e5070] shadow-[0_0_6px_#9e5070]',
    ribbon: 'from-[#9e5070] to-[#6b3048]',
  },
  Rare: {
    card: 'card-rare',
    accent: '#6ba3a3',
    muted: 'rgba(107,163,163,0.25)',
    faint: 'rgba(107,163,163,0.06)',
    label: 'RARE',
    labelColor: 'text-[#6ba3a3]',
    dot: 'bg-[#5a9090] shadow-[0_0_6px_#5a9090]',
    ribbon: 'from-[#5a9090] to-[#3a6060]',
  },
  Common: {
    card: 'card-common',
    accent: '#7a6f5d',
    muted: 'rgba(122,111,93,0.25)',
    faint: 'rgba(122,111,93,0.06)',
    label: 'COMMON',
    labelColor: 'text-[#7a6f5d]',
    dot: 'bg-[#7a6f5d]',
    ribbon: 'from-[#5a5040] to-[#3a3530]',
  },
} as const;

export default function FolioCard({ card, className, onClick, compact }: FolioCardProps) {
  const rarity = (card.rarity || card.grade || 'Common') as keyof typeof RARITY;
  const r = RARITY[rarity] || RARITY.Common;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer overflow-hidden group card-texture card-vignette",
        compact ? "w-full aspect-[2/3]" : "w-[19rem] aspect-[2/3]",
        "rounded-[4px]",
        r.card,
        className
      )}
    >
      {/* Lighting overlay - top light source */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/[0.15] pointer-events-none z-[1] rounded-[4px]" />

      {/* Inner frame */}
      <div
        className="absolute inset-[6px] rounded-[3px] pointer-events-none z-[2] transition-colors duration-700"
        style={{ border: `0.5px solid ${r.muted}` }}
      />

      {/* Rarity accent line at top */}
      <div className={cn("absolute top-0 left-[15%] right-[15%] h-[2px] rounded-b-full z-[3] bg-gradient-to-r", r.ribbon)} style={{ opacity: rarity === 'Common' ? 0.3 : 0.6 }} />

      {/* Content */}
      <div className={cn(
        "relative h-full flex flex-col z-[5]",
        compact ? "p-3.5 pt-3" : "p-6 pt-5"
      )}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-[5px] h-[5px] rounded-full shrink-0", r.dot)} />
            <span className={cn("font-serif tracking-[0.35em] font-semibold uppercase", r.labelColor, compact ? "text-[8px]" : "text-[10px]")}>
              {r.label}
            </span>
          </div>
          <span className={cn("font-serif text-folio-text-muted/30 tracking-[0.1em]", compact ? "text-[7px]" : "text-[9px]")}>
            {card.id || card.card_id}
          </span>
        </div>

        {/* Separator */}
        <div className="mt-2 mb-auto h-[0.5px]" style={{ background: `linear-gradient(to right, ${r.muted}, transparent)` }} />

        {/* ── Quote ── */}
        <div className={cn(
          "flex-1 flex flex-col justify-center items-center text-center relative",
          compact ? "py-2 px-0.5" : "py-5 px-1"
        )}>
          {/* Big decorative quote mark */}
          <span
            className={cn("font-serif leading-none select-none", compact ? "text-3xl mb-1" : "text-5xl mb-2")}
            style={{ color: r.muted, opacity: 0.5 }}
          >&ldquo;</span>

          <p className={cn(
            "font-serif text-folio-text leading-[1.8] font-light italic",
            compact ? "text-[0.78rem] line-clamp-4" : "text-[1rem]"
          )}>
            {card.original}
          </p>

          {/* Ornamental divider */}
          <div className={cn("flex items-center gap-2.5", compact ? "my-2" : "my-4")}>
            <div className="w-6 h-[0.5px]" style={{ background: `linear-gradient(to right, transparent, ${r.muted})` }} />
            <div className="w-[3px] h-[3px] rotate-45 border-[0.5px]" style={{ borderColor: r.muted }} />
            <div className="w-6 h-[0.5px]" style={{ background: `linear-gradient(to left, transparent, ${r.muted})` }} />
          </div>

          <p className={cn(
            "font-sans text-folio-text-secondary/70 leading-[1.7] font-light",
            compact ? "text-[0.68rem] line-clamp-3" : "text-[0.8rem]"
          )}>
            {card.translation}
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="mt-auto pt-2.5" style={{ borderTop: `0.5px dashed ${r.muted}` }}>
          <p className={cn("font-serif tracking-[0.12em] text-center font-medium", compact ? "text-[0.7rem]" : "text-[0.85rem]")} style={{ color: r.accent }}>
            {card.book}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <div className="w-2.5 h-[0.5px]" style={{ background: r.muted }} />
            <p className={cn("font-sans text-folio-text-muted/50 tracking-[0.18em] uppercase", compact ? "text-[6px]" : "text-[8px]")}>
              {card.author || BOOK_AUTHORS[card.book] || ''}
            </p>
            <div className="w-2.5 h-[0.5px]" style={{ background: r.muted }} />
          </div>
        </div>
      </div>

      {/* ── Hover Effects ── */}
      {/* Top light on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.06)_0%,transparent_60%)] pointer-events-none z-[3]" />

      {/* Legendary shimmer */}
      {rarity === 'Legendary' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[4px] z-[4]">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1.4s] ease-in-out bg-gradient-to-r from-transparent via-[#c4a24d]/10 to-transparent scale-y-150 rotate-12" />
        </div>
      )}
      {rarity === 'Epic' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#9e5070]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-[4]" />
      )}
    </motion.div>
  );
}
