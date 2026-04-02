import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { type UICard } from '../lib/cardAdapter';

interface CardProps {
  card: UICard;
  isRevealed: boolean;
  /** Flip revealed card to back to show BTL */
  isFlipped?: boolean;
  /** Grid thumbnail mode — fixed height, truncated text */
  compact?: boolean;
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
        borderColor: 'border-brand-brown/30',
        dividerBg: 'bg-brand-brown/15',
        dividerBgLight: 'bg-brand-brown/10',
        outerBorder: 'border border-brand-brown/15',
        innerBorder: 'border border-brand-brown/10',
        cornerBorder: 'border-brand-brown/30',
      };
  }
}

/** Whether to show BTL on the back face (only after card has been revealed/owned) */
interface BackFaceProps {
  card: UICard;
  rs: ReturnType<typeof getRarityStyles>;
  showBTL: boolean;
  compact: boolean;
}

function BackFaceContent({ card, rs, showBTL, compact }: BackFaceProps) {
  if (!showBTL) {
    // Unopened: "F" seal
    return (
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
    );
  }

  // Revealed: Between the Lines commentary
  return (
    <div className="w-full h-full border border-brand-gold/20 relative p-1" style={{ minHeight: 376 }}>
      <div className="w-full h-full border border-brand-gold/8 flex flex-col items-center p-5 relative">

        {/* Top ornament */}
        <div className="flex flex-col items-center mb-auto pt-2">
          <div className="w-5 h-[1px] bg-brand-gold/30 mb-4"></div>
          <span className="font-serif text-brand-gold/60 text-[8px] tracking-[0.4em] uppercase mb-2">Between the Lines</span>
          <span className="font-sans text-brand-gold/30 text-[7px] tracking-[0.2em] uppercase">{card.chapter}</span>
        </div>

        {/* Commentary text */}
        <div className="flex-1 flex flex-col justify-center items-center text-center px-3 my-4">
          <div className="w-3 h-3 rounded-full border-[0.5px] border-brand-gold/40 flex items-center justify-center mb-5">
            <span className="font-serif text-brand-gold/50 text-[7px]">F</span>
          </div>
          <p className={`font-serif text-brand-cream/70 text-[11px] leading-[2.2] tracking-wide ${compact ? 'line-clamp-5' : ''}`}>
            {card.context}
          </p>
        </div>

        {/* Bottom ornament */}
        <div className="flex flex-col items-center mt-auto pb-2">
          <div className="w-8 h-[1px] bg-brand-gold/15 mb-3"></div>
          <span className="font-sans text-brand-gold/30 text-[7px] tracking-[0.3em] uppercase">{card.author}</span>
          <span className="font-serif text-brand-cream/30 text-[7px] italic tracking-wider mt-1">{card.work}</span>
        </div>
      </div>
    </div>
  );
}

export default function Card({ card, isRevealed, isFlipped = false, compact = false }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Delay BTL content switch until flip animation completes,
  // so the back face doesn't visibly change mid-rotation.
  const [btlReady, setBtlReady] = useState(isRevealed);

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

  // Flip states: 0 = back/"F" seal, 180 = front/quotes, 360 = back/BTL
  const flipRotateY = !isRevealed ? 0 : isFlipped ? 360 : 180;

  return (
    <motion.div
      ref={cardRef}
      className={`w-64 cursor-pointer ${compact ? 'overflow-hidden' : ''}`}
      style={{
        perspective: 1200,
        transformStyle: 'preserve-3d',
        ...(compact ? { height: 400 } : {}),
      }}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={`w-full relative rounded-sm ${rs.glowClass}`}
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          rotateX: isHovering ? rotateX : 0,
          rotateY: isHovering ? rotateYTilt : 0,
        }}
      >
        <motion.div
          className="w-full relative"
          style={{ transformStyle: 'preserve-3d', minHeight: 400, willChange: 'transform' }}
          animate={{ rotateY: flipRotateY }}
          transition={{ type: 'spring', stiffness: 200, damping: 28, mass: 0.8 }}
          onAnimationComplete={() => setBtlReady(isRevealed)}
        >
          {/* ═══ BACK FACE — Dark (rotateY = 0) ═══ */}
          <div className="absolute inset-0 backface-hidden rounded-sm border border-brand-brown/20 overflow-hidden flex flex-col items-center justify-center p-2 bg-brand-dark text-brand-cream" style={{ minHeight: 400, willChange: 'transform' }}>
            <div className="absolute inset-0 card-texture opacity-20"></div>

            {isHovering && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-20 rounded-sm"
                style={{ background: sheenBack }}
              />
            )}

            <BackFaceContent card={card} rs={rs} showBTL={btlReady} compact={compact} />
          </div>

          {/* ═══ FRONT FACE — Always cream (rotateY = 180) ═══ */}
          <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-brand-cream rounded-sm overflow-hidden flex flex-col p-2 ${rs.cardClass} ${rs.borderClass ? 'border ' + rs.borderClass : 'border border-brand-brown/10'}`} style={{ minHeight: 400, willChange: 'transform' }}>
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
                    <p className={`font-serif text-brand-brown text-[13px] leading-[1.9] mb-5 tracking-wide ${compact ? 'line-clamp-3' : ''}`}>
                      &ldquo;{card.originalQuote}&rdquo;
                    </p>
                    <div className={`w-10 h-[1px] mb-5 ${rs.dividerBg}`}></div>
                    <p className={`font-serif text-brand-brown/55 text-[11px] leading-[1.8] tracking-wide ${compact ? 'line-clamp-2' : ''}`}>
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
  );
}
