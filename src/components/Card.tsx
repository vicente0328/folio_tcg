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
        accentColor: 'brand-gold',
        borderColor: 'border-brand-gold',
        dividerBg: 'bg-brand-gold/40',
        dividerBgLight: 'bg-brand-gold/20',
        outerBorder: 'border border-brand-gold/40',
        innerBorder: 'border border-brand-gold/20',
        cornerBorder: 'border-brand-gold',
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
        accentColor: 'purple-400',
        borderColor: 'border-purple-400/60',
        dividerBg: 'bg-purple-400/30',
        dividerBgLight: 'bg-purple-400/15',
        outerBorder: 'border border-purple-400/30',
        innerBorder: 'border border-purple-400/15',
        cornerBorder: 'border-purple-400/60',
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
        accentColor: 'gray-400',
        borderColor: 'border-gray-400/60',
        dividerBg: 'bg-gray-400/30',
        dividerBgLight: 'bg-gray-400/15',
        outerBorder: 'border border-gray-400/30',
        innerBorder: 'border border-gray-400/15',
        cornerBorder: 'border-gray-400/60',
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
        accentColor: 'brand-brown',
        borderColor: 'border-brand-brown/30',
        dividerBg: 'bg-brand-brown/15',
        dividerBgLight: 'bg-brand-brown/10',
        outerBorder: 'border border-brand-brown/15',
        innerBorder: 'border border-brand-brown/10',
        cornerBorder: 'border-brand-brown/30',
      };
  }
}

export default function Card({ card, isRevealed, showBTL = false }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const rs = getRarityStyles(card.rarity);

  // 3D tilt effect
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateYTilt = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 300, damping: 30 });

  // Light reflection position
  const sheenX = useTransform(mouseX, [0, 1], [-100, 200]);
  const sheenY = useTransform(mouseY, [0, 1], [-100, 200]);

  // Pre-compute sheen backgrounds (hooks must not be conditional)
  const sheenBack = useTransform(
    [sheenX, sheenY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.1) 0%, transparent 60%)`
  );
  const sheenFront = useTransform(
    [sheenX, sheenY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.2) 0%, transparent 50%)`
  );

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
    <div className="flex flex-col items-center">
      <motion.div
        ref={cardRef}
        className="w-64 cursor-pointer"
        style={{
          perspective: 1200,
          transformStyle: 'preserve-3d',
        }}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setIsHovering(true)}
        onPointerLeave={handlePointerLeave}
      >
        <motion.div
          className={`w-full relative rounded-sm ${rs.glowClass}`}
          style={{
            transformStyle: 'preserve-3d',
            rotateX: isHovering ? rotateX : 0,
            rotateY: isHovering ? rotateYTilt : 0,
          }}
        >
          <motion.div
            className="w-full relative"
            style={{ transformStyle: 'preserve-3d', minHeight: 400 }}
            animate={{ rotateY: flipRotateY }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* ═══ BACK FACE — Always dark (rotateY = 0) ═══ */}
            <div className="absolute inset-0 backface-hidden rounded-sm border border-brand-brown/20 overflow-hidden flex flex-col items-center justify-center p-2 bg-brand-dark text-brand-cream" style={{ minHeight: 400 }}>
              <div className="absolute inset-0 card-texture opacity-20"></div>

              {isHovering && (
                <motion.div
                  className="absolute inset-0 pointer-events-none z-20 rounded-sm"
                  style={{ background: sheenBack }}
                />
              )}

              <div className="w-full h-full border border-brand-gold/30 relative p-1" style={{ minHeight: 376 }}>
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
            <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-brand-cream rounded-sm overflow-hidden flex flex-col p-2 ${rs.cardClass} ${rs.borderClass ? 'border ' + rs.borderClass : 'border border-brand-brown/10'}`} style={{ minHeight: 400 }}>
              <div className={`absolute inset-0 card-texture ${card.rarity === 'Common' ? 'opacity-35' : 'opacity-50'}`}></div>

              {/* Rarity overlays */}
              {rs.hasHolo && <div className="holo-overlay" />}
              {rs.hasGoldParticles && <div className="gold-particles" />}

              {card.rarity === 'Legendary' && (
                <div className="absolute inset-0 rounded-sm legendary-border pointer-events-none" />
              )}

              {isHovering && (
                <motion.div
                  className="absolute inset-0 pointer-events-none z-20 rounded-sm"
                  style={{ background: sheenFront }}
                />
              )}

              {/* Double Border Frame */}
              <div className={`w-full flex-1 relative p-1.5 ${rs.outerBorder}`}>
                <div className={`w-full h-full flex flex-col items-center relative ${rs.innerBorder}`}>

                  {/* Corner Accents */}
                  {['top-0 left-0 border-t border-l', 'top-0 right-0 border-t border-r', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'].map((pos) => (
                    <div key={pos} className={`absolute w-2.5 h-2.5 ${pos} ${rs.cornerBorder}`} />
                  ))}

                  <div className="relative z-10 flex-1 flex flex-col w-full px-5 py-5">
                    {/* Header: Author & Work */}
                    <div className="text-center flex flex-col items-center mb-6">
                      <div className={`w-5 h-[1px] mb-4 ${rs.dividerBg}`}></div>
                      <h3 className={`font-serif text-[10px] tracking-[0.3em] uppercase mb-2 ${rs.textClass || 'text-brand-brown'}`}>{card.author}</h3>
                      <h4 className="font-serif text-brand-brown/60 text-xs italic tracking-widest">{card.work}</h4>
                    </div>

                    {/* Body: Quotes — generous spacing */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center px-1">
                      <p className="font-serif text-brand-brown text-[13px] leading-[1.9] mb-5 tracking-wide">
                        &ldquo;{card.originalQuote}&rdquo;
                      </p>
                      <div className={`w-10 h-[1px] mb-5 ${rs.dividerBg}`}></div>
                      <p className="font-serif text-brand-brown/55 text-[11px] leading-[1.8] tracking-wide">
                        {card.translatedQuote}
                      </p>
                    </div>

                    {/* Footer: Logo & Rarity */}
                    <div className="flex flex-col items-center gap-2.5 mt-6">
                      <div className={`w-6 h-6 rounded-full border-[0.5px] flex items-center justify-center ${rs.borderColor}`}>
                        <span className={`font-serif text-[10px] ${card.rarity === 'Legendary' ? 'text-brand-gold' : card.rarity === 'Epic' ? 'text-purple-400' : card.rarity === 'Rare' ? 'text-gray-400' : 'text-brand-brown/30'}`}>F</span>
                      </div>
                      <span className={`font-sans text-[8px] font-medium tracking-[0.3em] uppercase ${rs.labelClass || 'text-brand-brown/40'}`}>{card.rarity}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ═══ BTL Panel — expands BELOW the card like opening a folded letter ═══ */}
      <AnimatePresence>
        {showBTL && isRevealed && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: -4 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="w-64 overflow-hidden"
          >
            <div className={`bg-brand-cream rounded-b-sm border-x border-b px-6 py-5 relative ${card.rarity === 'Legendary' ? 'border-brand-gold/30' : card.rarity === 'Epic' ? 'border-purple-400/20' : card.rarity === 'Rare' ? 'border-gray-400/20' : 'border-brand-brown/10'}`}>
              <div className={`absolute inset-0 card-texture opacity-40`}></div>

              {/* Top connecting seam */}
              <div className="relative z-10">
                <div className="flex flex-col items-center mb-4">
                  <div className={`w-8 h-[1px] mb-3 ${rs.dividerBgLight}`}></div>
                  <h3 className="font-serif text-brand-brown/50 text-[8px] tracking-[0.3em] uppercase">Between the Lines</h3>
                  <p className="font-sans text-brand-brown/25 text-[7px] tracking-wider mt-1.5">{card.chapter}</p>
                </div>
                <p className="font-serif text-brand-brown/65 text-[10px] leading-[2] text-center tracking-wide">
                  {card.context}
                </p>
                <div className="flex justify-center mt-4">
                  <div className={`w-4 h-[1px] ${rs.dividerBgLight}`}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
