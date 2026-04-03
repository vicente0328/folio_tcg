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
  /** Called when flip animation finishes settling */
  onFlipComplete?: () => void;
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
    // Unopened: Luxury seal design
    return (
      <div className="w-full h-full border border-brand-gold/20 relative p-1.5" style={{ minHeight: 376 }}>
        <div className="w-full h-full border border-brand-gold/10 flex flex-col items-center justify-center p-6 relative">

          {/* Corner flourishes */}
          {['top-2 left-2 border-t border-l', 'top-2 right-2 border-t border-r', 'bottom-2 left-2 border-b border-l', 'bottom-2 right-2 border-b border-r'].map((pos) => (
            <div key={pos} className={`absolute w-4 h-4 ${pos} border-brand-gold/20`} />
          ))}

          {/* Decorative line above seal */}
          <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent mb-6"></div>

          {/* Seal emblem */}
          <motion.div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center relative"
            style={{
              background: 'radial-gradient(circle, rgba(184,144,71,0.08) 0%, transparent 70%)',
              boxShadow: '0 0 20px rgba(184,144,71,0.1)',
            }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(184,144,71,0.08)',
                '0 0 30px rgba(184,144,71,0.18)',
                '0 0 20px rgba(184,144,71,0.08)',
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-[60px] h-[60px] rounded-full border border-brand-gold/30 flex items-center justify-center">
              <div className="w-[48px] h-[48px] rounded-full border-[0.5px] border-brand-gold/15 flex items-center justify-center">
                <span className="font-serif text-brand-gold/80 text-2xl">F</span>
              </div>
            </div>
          </motion.div>

          {/* Brand text */}
          <div className="flex flex-col items-center mt-6">
            <span className="font-serif text-brand-gold/40 text-[9px] tracking-[0.5em] uppercase">Folio</span>
            <div className="w-6 h-[1px] bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent mt-3"></div>
          </div>

          {/* Subtle edition text */}
          <span className="font-sans text-brand-gold/20 text-[7px] tracking-[0.3em] uppercase mt-auto pt-4">
            Season One
          </span>
        </div>
      </div>
    );
  }

  // Revealed: Between the Lines commentary
  return (
    <div className="w-full h-full border border-brand-gold/15 relative p-1.5" style={{ minHeight: 376 }}>
      <div className="w-full h-full border border-brand-gold/8 flex flex-col items-center p-5 relative">

        {/* Top ornament */}
        <div className="flex flex-col items-center mb-auto pt-2">
          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-brand-gold/25 to-transparent mb-4"></div>
          <span className="font-serif text-brand-gold/50 text-[8px] tracking-[0.4em] uppercase mb-2">Between the Lines</span>
          <span className="font-sans text-brand-gold/25 text-[7px] tracking-[0.2em] uppercase">{card.chapter}</span>
        </div>

        {/* Commentary text */}
        <div className="flex-1 flex flex-col justify-center items-center text-center px-3 my-4">
          <span className="font-serif text-brand-gold/30 text-[9px] mb-5">&laquo;</span>
          <p className={`font-serif text-brand-cream/60 text-[11px] leading-[2.2] tracking-wide ${compact ? 'line-clamp-5' : ''}`}>
            {card.context}
          </p>
          <span className="font-serif text-brand-gold/30 text-[9px] mt-5">&raquo;</span>
        </div>

        {/* Bottom ornament */}
        <div className="flex flex-col items-center mt-auto pb-2">
          <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-brand-gold/15 to-transparent mb-3"></div>
          <span className="font-sans text-brand-gold/30 text-[7px] tracking-[0.3em] uppercase">{card.author}</span>
          <span className="font-serif text-brand-cream/25 text-[7px] italic tracking-wider mt-1">{card.work}</span>
        </div>
      </div>
    </div>
  );
}

export default function Card({ card, isRevealed, isFlipped = false, compact = false, onFlipComplete }: CardProps) {
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
        className={`w-full relative rounded-lg ${rs.glowClass}`}
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          rotateX: isHovering ? rotateX : 0,
          rotateY: isHovering ? rotateYTilt : 0,
          boxShadow: '0 2px 0 0 rgba(26,17,10,0.15), 0 4px 8px rgba(26,17,10,0.1), 0 8px 20px rgba(26,17,10,0.08)',
        }}
      >
        <motion.div
          className="w-full relative"
          style={{ transformStyle: 'preserve-3d', minHeight: 400, willChange: 'transform' }}
          initial={{ rotateY: flipRotateY }}
          animate={{ rotateY: flipRotateY }}
          transition={{ type: 'spring', stiffness: 200, damping: 28, mass: 0.8 }}
          onAnimationComplete={() => {
            setBtlReady(isRevealed);
            onFlipComplete?.();
          }}
        >
          {/* ═══ BACK FACE — Rich espresso (rotateY = 0) ═══ */}
          <div className="absolute inset-0 backface-hidden rounded-lg border border-brand-gold/15 overflow-hidden flex flex-col items-center justify-center p-2 text-brand-cream" style={{ minHeight: 400, willChange: 'transform', background: 'linear-gradient(160deg, #1C1410 0%, #120E0A 50%, #1A1410 100%)' }}>
            <div className="absolute inset-0 card-texture opacity-15"></div>

            {isHovering && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-20 rounded-lg"
                style={{ background: sheenBack }}
              />
            )}

            <BackFaceContent card={card} rs={rs} showBTL={btlReady} compact={compact} />
          </div>

          {/* ═══ FRONT FACE — Always cream (rotateY = 180) ═══ */}
          <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-brand-cream rounded-lg overflow-hidden flex flex-col p-2 ${rs.cardClass} ${rs.borderClass ? 'border ' + rs.borderClass : 'border border-brand-brown/10'}`} style={{ minHeight: 400, willChange: 'transform' }}>
            <div className={`absolute inset-0 card-texture ${card.rarity === 'Common' ? 'opacity-35' : 'opacity-50'}`}></div>

            {/* Rarity overlays */}
            {rs.hasHolo && <div className="holo-overlay" />}
            {rs.hasGoldParticles && <div className="gold-particles" />}

            {card.rarity === 'Legendary' && (
              <div className="absolute inset-0 rounded-lg legendary-border pointer-events-none" />
            )}

            {isHovering && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-20 rounded-lg"
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
