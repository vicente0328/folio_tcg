import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { type UICard } from '../lib/cardAdapter';

interface CardProps {
  card: UICard;
  isRevealed: boolean;
  showBTL?: boolean;
}

/** Returns rarity-specific CSS classes */
function getRarityStyles(rarity: string) {
  switch (rarity) {
    case 'Legendary':
      return {
        cardClass: 'card-legendary',
        borderClass: '',
        glowClass: 'legendary-glow',
        textClass: 'gold-text',
        labelClass: 'gold-text',
        hasGoldParticles: true,
        hasHolo: false,
      };
    case 'Epic':
      return {
        cardClass: 'card-epic',
        borderClass: 'epic-border',
        glowClass: '',
        textClass: 'epic-text',
        labelClass: 'epic-text',
        hasGoldParticles: false,
        hasHolo: true,
      };
    case 'Rare':
      return {
        cardClass: 'card-rare',
        borderClass: 'rare-border',
        glowClass: '',
        textClass: 'silver-foil',
        labelClass: 'silver-foil',
        hasGoldParticles: false,
        hasHolo: false,
      };
    default: // Common
      return {
        cardClass: 'card-common',
        borderClass: '',
        glowClass: 'shadow-[0_15px_35px_rgba(26,17,10,0.15)]',
        textClass: '',
        labelClass: '',
        hasGoldParticles: false,
        hasHolo: false,
      };
  }
}

export default function Card({ card, isRevealed, showBTL = false }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const rarityStyle = getRarityStyles(card.rarity);

  // 3D tilt effect
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateYTilt = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 300, damping: 30 });

  // Light reflection position
  const sheenX = useTransform(mouseX, [0, 1], [-100, 200]);
  const sheenY = useTransform(mouseY, [0, 1], [-100, 200]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handlePointerLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setIsHovering(false);
  };

  // Simple flip: 0 = back (dark), 180 = front (cream)
  const flipRotateY = isRevealed ? 180 : 0;

  return (
    <motion.div
      ref={cardRef}
      className="w-64 h-[400px] cursor-pointer"
      style={{
        perspective: 1200,
        transformStyle: 'preserve-3d',
      }}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={`w-full h-full relative rounded-sm ${rarityStyle.glowClass}`}
        style={{
          transformStyle: 'preserve-3d',
          rotateX: isHovering ? rotateX : 0,
          rotateY: isHovering ? rotateYTilt : 0,
        }}
      >
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipRotateY }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* ═══ BACK FACE — Always dark (rotateY = 0) ═══ */}
          <div className="absolute inset-0 backface-hidden rounded-sm border border-brand-brown/20 overflow-hidden flex flex-col items-center justify-center p-2 bg-brand-dark text-brand-cream">
            <div className="absolute inset-0 card-texture opacity-20"></div>

            {/* Light reflection overlay */}
            {isHovering && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-20 rounded-sm"
                style={{
                  background: useTransform(
                    [sheenX, sheenY],
                    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.1) 0%, transparent 60%)`
                  ),
                }}
              />
            )}

            <div className="w-full h-full border border-brand-gold/30 relative p-1">
              <div className="w-full h-full border border-brand-gold/10 flex flex-col items-center justify-center p-6 relative">
                <motion.div
                  className="w-16 h-16 rounded-full border-[0.5px] border-brand-gold flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(184,144,71,0.2)]"
                  animate={{ boxShadow: ['0 0 15px rgba(184,144,71,0.1)', '0 0 25px rgba(184,144,71,0.3)', '0 0 15px rgba(184,144,71,0.1)'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="font-serif text-brand-gold text-2xl">F</span>
                </motion.div>
                <span className="font-sans text-brand-gold/50 text-[10px] tracking-[0.4em] uppercase">Folio</span>
              </div>
            </div>
          </div>

          {/* ═══ FRONT FACE — Always cream (rotateY = 180) ═══ */}
          <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-brand-cream rounded-sm overflow-hidden flex flex-col items-center justify-center p-2 ${rarityStyle.cardClass} ${rarityStyle.borderClass ? 'border ' + rarityStyle.borderClass : 'border border-brand-brown/10'}`}>
            <div className={`absolute inset-0 card-texture ${card.rarity === 'Common' ? 'opacity-35' : 'opacity-50'}`}></div>

            {/* Rarity overlays */}
            {rarityStyle.hasHolo && <div className="holo-overlay" />}
            {rarityStyle.hasGoldParticles && <div className="gold-particles" />}

            {/* Legendary rotating gold border */}
            {card.rarity === 'Legendary' && (
              <div className="absolute inset-0 rounded-sm legendary-border pointer-events-none" />
            )}

            {/* Light reflection overlay */}
            {isHovering && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-20 rounded-sm"
                style={{
                  background: useTransform(
                    [sheenX, sheenY],
                    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.2) 0%, transparent 50%)`
                  ),
                }}
              />
            )}

            {/* Symmetrical Double Border */}
            <div className={`w-full h-full relative p-1 ${card.rarity === 'Legendary' ? 'border border-brand-gold/40' : card.rarity === 'Epic' ? 'border border-purple-400/30' : card.rarity === 'Rare' ? 'border border-gray-400/30' : 'border border-brand-brown/15'}`}>
              <div className={`w-full h-full flex flex-col items-center p-4 relative ${card.rarity === 'Legendary' ? 'border border-brand-gold/20' : card.rarity === 'Epic' ? 'border border-purple-400/15' : card.rarity === 'Rare' ? 'border border-gray-400/15' : 'border border-brand-brown/10'}`}>

                {/* Corner Accents */}
                {['top-0 left-0 border-t border-l', 'top-0 right-0 border-t border-r', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'].map((pos) => (
                  <div key={pos} className={`absolute w-2 h-2 ${pos} ${card.rarity === 'Legendary' ? 'border-brand-gold' : card.rarity === 'Epic' ? 'border-purple-400/60' : card.rarity === 'Rare' ? 'border-gray-400/60' : 'border-brand-brown/30'}`} />
                ))}

                <div className="relative z-10 flex-1 flex flex-col w-full overflow-hidden">
                  {/* Header: Author & Work */}
                  <div className="text-center mb-auto pt-2 flex flex-col items-center shrink-0">
                    <div className={`w-4 h-[1px] mb-3 ${card.rarity === 'Legendary' ? 'bg-brand-gold' : card.rarity === 'Epic' ? 'bg-purple-400/60' : card.rarity === 'Rare' ? 'bg-gray-400/60' : 'bg-brand-brown/30'}`}></div>
                    <h3 className={`font-serif text-[10px] tracking-[0.3em] uppercase mb-1.5 ${rarityStyle.textClass || 'text-brand-brown'}`}>{card.author}</h3>
                    <h4 className="font-serif text-brand-brown/70 text-xs italic tracking-widest">{card.work}</h4>
                  </div>

                  {/* Body: Quotes */}
                  <div className="flex-1 flex flex-col justify-center items-center text-center my-4 px-2 min-h-0">
                    <p className="font-serif text-brand-brown text-sm leading-relaxed mb-4 tracking-wide">
                      &ldquo;{card.originalQuote}&rdquo;
                    </p>
                    <div className={`w-12 h-[1px] mb-4 ${card.rarity === 'Legendary' ? 'bg-brand-gold/40' : card.rarity === 'Epic' ? 'bg-purple-400/30' : card.rarity === 'Rare' ? 'bg-gray-400/30' : 'bg-brand-brown/15'}`}></div>
                    <p className="font-serif text-brand-brown/60 text-[11px] leading-relaxed">
                      {card.translatedQuote}
                    </p>
                  </div>

                  {/* BTL Section — slides in from bottom */}
                  <AnimatePresence>
                    {showBTL && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden shrink-0"
                      >
                        <div className={`pt-3 border-t ${card.rarity === 'Legendary' ? 'border-brand-gold/20' : card.rarity === 'Epic' ? 'border-purple-400/15' : card.rarity === 'Rare' ? 'border-gray-400/15' : 'border-brand-brown/10'}`}>
                          <div className="flex flex-col items-center mb-2">
                            <h3 className="font-serif text-brand-brown/60 text-[8px] tracking-[0.3em] uppercase">Between the Lines</h3>
                            <p className="font-sans text-brand-brown/30 text-[7px] tracking-wide mt-1">{card.chapter}</p>
                          </div>
                          <p className="font-serif text-brand-brown/70 text-[10px] leading-loose text-center tracking-wide">
                            {card.context}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer: Rarity & Logo */}
                  <div className="mt-auto pb-1 flex flex-col items-center gap-2 shrink-0">
                    <div className={`w-6 h-6 rounded-full border-[0.5px] flex items-center justify-center ${card.rarity === 'Legendary' ? 'border-brand-gold' : card.rarity === 'Epic' ? 'border-purple-400/60' : card.rarity === 'Rare' ? 'border-gray-400/60' : 'border-brand-brown/20'}`}>
                      <span className={`font-serif text-[10px] ${card.rarity === 'Legendary' ? 'text-brand-gold' : card.rarity === 'Epic' ? 'text-purple-400' : card.rarity === 'Rare' ? 'text-gray-400' : 'text-brand-brown/30'}`}>F</span>
                    </div>
                    <span className={`font-sans text-[9px] font-medium tracking-[0.3em] uppercase ${rarityStyle.labelClass || 'text-brand-brown/40'}`}>{card.rarity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
