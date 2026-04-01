import { motion } from 'framer-motion';
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
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0V0zm10 10l10 10H0L10 10z\' fill=\'%23c9a84c\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]'
  },
  Epic: {
    cardClass: 'card-epic',
    accent: '#c76d8a',
    accentMuted: 'rgba(199, 109, 138, 0.3)',
    label: 'EPIC',
    labelClass: 'text-[#c76d8a]',
    borderClass: 'border-[#8b4563]/40',
    glowClass: 'shadow-[0_0_30px_rgba(139,69,99,0.1)]',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'2\' fill=\'%23c76d8a\' fill-opacity=\'0.03\'/%3E%3C/svg%3E")]'
  },
  Rare: {
    cardClass: 'card-rare',
    accent: '#6ba3a3',
    accentMuted: 'rgba(107, 163, 163, 0.3)',
    label: 'RARE',
    labelClass: 'text-[#6ba3a3]',
    borderClass: 'border-[#4a7c7c]/40',
    glowClass: 'shadow-[0_0_20px_rgba(74,124,124,0.08)]',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20z\' fill=\'%236ba3a3\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]'
  },
  Common: {
    cardClass: 'card-common',
    accent: '#8a7e6b',
    accentMuted: 'rgba(138, 126, 107, 0.3)',
    label: 'COMMON',
    labelClass: 'text-[#8a7e6b]',
    borderClass: 'border-[#3d3425]/60',
    glowClass: '',
    pattern: ''
  },
} as const;

export default function FolioCard({ card, className, onClick, compact }: FolioCardProps) {
  const rarity = (card.rarity || card.grade || 'Common') as keyof typeof RARITY_CONFIG;
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.Common;

  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.4, ease: "easeOut" } }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer overflow-hidden group transition-all duration-500",
        compact ? "w-full aspect-[2/3]" : "w-[20rem] h-[30rem]",
        "rounded-md",
        config.cardClass,
        config.glowClass,
        "border-[0.5px]",
        className
      )}
    >
      {/* Background Pattern */}
      <div className={cn("absolute inset-0 z-0", config.pattern)} />

      {/* Dynamic Lighting Effects */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 via-transparent to-black/40 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

      {/* Elegant Inner Frame */}
      <div className={cn(
        "absolute inset-[6px] z-0 border-[0.5px] rounded-sm transition-colors duration-500",
        config.borderClass,
        "group-hover:border-opacity-100"
      )} />

      {/* Content Container */}
      <div className="relative h-full flex flex-col p-6 pt-5 z-10">

        {/* Header: Rarity & ID */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              rarity === 'Legendary' ? "bg-[#c9a84c] shadow-[0_0_8px_#c9a84c]" :
              rarity === 'Epic' ? "bg-[#c76d8a] shadow-[0_0_8px_#c76d8a]" :
              rarity === 'Rare' ? "bg-[#6ba3a3] shadow-[0_0_8px_#6ba3a3]" :
              "bg-[#8a7e6b]"
            )} />
            <span className={cn(
              "font-serif text-[11px] tracking-[0.4em] uppercase font-semibold",
              config.labelClass
            )}>
              {config.label}
            </span>
          </div>
          <span className="font-sans text-[10px] text-folio-text-muted/60 tracking-[0.2em] bg-folio-bg/50 px-2 py-0.5 rounded-sm border border-folio-border-light/30">
            NO. {String(card.id || card.card_id).padStart(3, '0')}
          </span>
        </div>

        {/* Quote Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center px-2 z-10">
          <div className="relative">
            {/* Opening quote mark behind text */}
            <span className="absolute -top-8 -left-6 font-serif text-6xl leading-none opacity-20 select-none" style={{ color: config.accent }}>&ldquo;</span>
            
            <p className={cn(
              "font-serif text-folio-text leading-[1.8] relative z-10",
              compact ? "text-base" : "text-lg",
              "drop-shadow-md"
            )}>
              {card.original}
            </p>
          </div>

          {/* Ornamental divider */}
          <div className="flex items-center gap-4 my-6 opacity-80">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-current" style={{ color: config.accent }} />
            <span className="text-[10px] transform rotate-45 w-2 h-2 border" style={{ borderColor: config.accent }} />
            <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-current" style={{ color: config.accent }} />
          </div>

          <p className={cn(
            "font-sans font-light text-folio-text-muted leading-relaxed",
            compact ? "text-[0.85rem]" : "text-[0.9rem]"
          )}>
            {card.translation}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-5 mt-auto border-t border-dashed border-folio-border-light/50 relative z-10">
          <p className="font-serif text-base tracking-[0.15em] text-center mb-1.5 font-medium" style={{ color: config.accent }}>
            {card.book}
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="h-[1px] w-4 bg-folio-border-light/60" />
            <p className="font-sans text-[11px] text-folio-text-muted/80 tracking-[0.2em] text-center uppercase">
              {card.author || BOOK_AUTHORS[card.book] || 'UNKNOWN'}
            </p>
            <div className="h-[1px] w-4 bg-folio-border-light/60" />
          </div>
        </div>
      </div>

      {/* Holographic / Shimmer Effects */}
      {rarity === 'Legendary' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#c9a84c]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none rotate-12 scale-150" />
        </>
      )}
      {rarity === 'Epic' && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#c76d8a]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
      )}
    </motion.div>
  );
}