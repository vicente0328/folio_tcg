import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { BOOK_AUTHORS } from '../data/cards';

interface FolioCardProps {
  card: any;
  className?: string;
  onClick?: () => void;
  compact?: boolean;
}

const RARITY_CONFIG = {
  Legendary: {
    cardClass: 'card-legendary',
    accent: '#c9a84c',
    accentMuted: 'rgba(201, 168, 76, 0.3)',
    label: 'LEGENDARY',
    labelClass: 'text-[#c9a84c]',
    borderClass: 'border-[#c9a84c]/40',
    glowClass: 'shadow-[0_0_40px_rgba(201,168,76,0.12)]',
  },
  Epic: {
    cardClass: 'card-epic',
    accent: '#c76d8a',
    accentMuted: 'rgba(199, 109, 138, 0.3)',
    label: 'EPIC',
    labelClass: 'text-[#c76d8a]',
    borderClass: 'border-[#8b4563]/40',
    glowClass: 'shadow-[0_0_30px_rgba(139,69,99,0.1)]',
  },
  Rare: {
    cardClass: 'card-rare',
    accent: '#6ba3a3',
    accentMuted: 'rgba(107, 163, 163, 0.3)',
    label: 'RARE',
    labelClass: 'text-[#6ba3a3]',
    borderClass: 'border-[#4a7c7c]/40',
    glowClass: 'shadow-[0_0_20px_rgba(74,124,124,0.08)]',
  },
  Common: {
    cardClass: 'card-common',
    accent: '#8a7e6b',
    accentMuted: 'rgba(138, 126, 107, 0.3)',
    label: 'COMMON',
    labelClass: 'text-[#8a7e6b]',
    borderClass: 'border-[#3d3425]/60',
    glowClass: '',
  },
} as const;

export default function FolioCard({ card, className, onClick, compact }: FolioCardProps) {
  const rarity = (card.rarity || card.grade || 'Common') as keyof typeof RARITY_CONFIG;
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.Common;

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer overflow-hidden group transition-all duration-500",
        compact ? "w-full h-[22rem]" : "w-[18rem] h-[27rem]",
        "rounded-sm",
        config.cardClass,
        config.glowClass,
        className
      )}
    >
      {/* Corner Ornaments */}
      <div className={cn("absolute top-3 left-3 w-4 h-4 border-t border-l", config.borderClass)} />
      <div className={cn("absolute top-3 right-3 w-4 h-4 border-t border-r", config.borderClass)} />
      <div className={cn("absolute bottom-3 left-3 w-4 h-4 border-b border-l", config.borderClass)} />
      <div className={cn("absolute bottom-3 right-3 w-4 h-4 border-b border-r", config.borderClass)} />

      {/* Content */}
      <div className="relative h-full flex flex-col p-6 pt-5 z-10">

        {/* Header: Rarity & ID */}
        <div className="flex justify-between items-center mb-1">
          <span className={cn(
            "font-serif text-[10px] tracking-[0.35em] uppercase font-medium",
            config.labelClass
          )}>
            {config.label}
          </span>
          <span className="font-serif text-[9px] text-folio-text-muted/50 tracking-[0.2em]">
            {card.id || card.card_id}
          </span>
        </div>

        {/* Thin divider */}
        <div className="h-[0.5px] mb-auto" style={{ background: `linear-gradient(to right, ${config.accentMuted}, transparent)` }} />

        {/* Quote Area - centered */}
        <div className="flex-1 flex flex-col justify-center items-center text-center py-6 gap-5">
          {/* Opening quote mark */}
          <span className="font-serif text-2xl leading-none" style={{ color: config.accentMuted }}>&ldquo;</span>

          <p className={cn(
            "font-serif text-folio-text leading-[1.8] italic",
            compact ? "text-[0.95rem] px-2" : "text-[1.05rem] px-3"
          )}>
            {card.original}
          </p>

          {/* Ornamental divider */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-[0.5px]" style={{ background: config.accentMuted }} />
            <span className="text-[8px]" style={{ color: config.accentMuted }}>&#10043;</span>
            <div className="w-6 h-[0.5px]" style={{ background: config.accentMuted }} />
          </div>

          <p className={cn(
            "font-serif text-folio-text-muted leading-relaxed",
            compact ? "text-[0.8rem] px-2" : "text-[0.85rem] px-4"
          )}>
            {card.translation}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-auto" style={{ borderTop: `0.5px solid ${config.accentMuted}` }}>
          <p className="font-serif text-sm tracking-[0.1em] text-center mb-0.5" style={{ color: config.accent }}>
            {card.book}
          </p>
          <p className="font-serif text-[10px] text-folio-text-muted/60 tracking-[0.25em] text-center uppercase">
            {card.author || BOOK_AUTHORS[card.book] || ''}{card.chapter ? ` \u00B7 ${card.chapter}` : ''}
          </p>
        </div>
      </div>

      {/* Legendary shimmer effect */}
      {rarity === 'Legendary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-[#c9a84c]/8 to-transparent pointer-events-none" />
      )}
    </motion.div>
  );
}
