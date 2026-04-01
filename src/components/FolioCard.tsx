import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { CardData, BOOK_AUTHORS } from '../data/cards';

interface FolioCardProps {
  card: CardData | any;
  className?: string;
  onClick?: () => void;
}

export default function FolioCard({ card, className, onClick }: FolioCardProps) {
  // Map grade to rarity if needed
  const rarity = card.rarity || card.grade || 'Common';
  
  const rarityStyles = {
    Legendary: 'from-[#d4af37]/20 via-[#d4af37]/10 to-transparent border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.3)]',
    Epic: 'from-[#9d4edd]/20 via-[#9d4edd]/10 to-transparent border-[#9d4edd] shadow-[0_0_20px_rgba(157,78,221,0.2)]',
    Rare: 'from-[#4ea8de]/20 via-[#4ea8de]/10 to-transparent border-[#4ea8de] shadow-[0_0_15px_rgba(78,168,222,0.15)]',
    Common: 'from-white/5 via-transparent to-transparent border-white/20 shadow-lg'
  }[rarity] || 'from-white/5 via-transparent to-transparent border-white/20 shadow-lg';

  const rarityText = {
    Legendary: 'text-[#d4af37]',
    Epic: 'text-[#9d4edd]',
    Rare: 'text-[#4ea8de]',
    Common: 'text-white/70'
  }[rarity] || 'text-white/70';

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "relative w-[20em] h-[30em] rounded-2xl cursor-pointer overflow-hidden group transition-all duration-500",
        "bg-[#1a140a] border-[0.15em]",
        rarityStyles,
        className
      )}
    >
      {/* Texture Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-30 mix-blend-overlay pointer-events-none" />
      
      {/* Gradient Overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", rarityStyles.split(' ')[0], rarityStyles.split(' ')[1], rarityStyles.split(' ')[2])} />

      {/* Content Container */}
      <div className="relative h-full flex flex-col p-[1.5em] z-10">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-[2em]">
          <div className="flex flex-col">
            <span className={cn("font-serif text-[0.8em] tracking-widest uppercase font-bold", rarityText)}>
              {rarity}
            </span>
            <span className="font-serif text-[0.6em] text-folio-text-muted tracking-wider">
              {card.id || card.card_id}
            </span>
          </div>
          <div className="w-[2em] h-[2em] rounded-full border border-folio-gold/30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <span className="font-serif text-[1em] text-folio-gold">F</span>
          </div>
        </div>

        {/* Quote Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-[1.5em]">
          <p className="font-serif text-[1.2em] text-folio-text leading-relaxed italic px-[0.5em] drop-shadow-md">
            "{card.original}"
          </p>
          
          <div className="w-[3em] h-[1px] bg-folio-gold/30" />
          
          <p className="font-serif text-[0.9em] text-folio-text-muted leading-relaxed px-[1em]">
            {card.translation}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-[2em] pt-[1em] border-t border-folio-gold/20 flex flex-col items-center text-center">
          <h3 className="font-serif text-[1em] text-folio-gold tracking-wider mb-[0.2em]">
            {card.book}
          </h3>
          <p className="font-serif text-[0.7em] text-folio-text-muted tracking-widest uppercase">
            {card.author || BOOK_AUTHORS[card.book] || ''} • {card.chapter}
          </p>
        </div>
      </div>

      {/* Shine Effect on Hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none" />
    </motion.div>
  );
}
