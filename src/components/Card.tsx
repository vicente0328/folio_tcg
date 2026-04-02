import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { type UICard } from '../lib/cardAdapter';

interface CardProps {
  card: UICard;
  isRevealed: boolean;
  isFlipped: boolean;
}

const RARITY_GLOW: Record<string, string> = {
  Legendary: 'shadow-[0_0_40px_rgba(184,144,71,0.4)]',
  Epic: 'shadow-[0_0_30px_rgba(128,90,213,0.3)]',
  Rare: 'shadow-[0_0_25px_rgba(100,140,180,0.25)]',
  Common: 'shadow-[0_15px_35px_rgba(26,17,10,0.15)]',
};

export default function Card({ card, isRevealed, isFlipped }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

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

  // rotateY logic for card flip
  let flipRotateY = 0;
  if (isRevealed) {
    flipRotateY = isFlipped ? 360 : 180;
  }

  const glowClass = isRevealed ? (RARITY_GLOW[card.rarity] || RARITY_GLOW.Common) : 'shadow-[0_15px_35px_rgba(26,17,10,0.3)]';

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
        className={`w-full h-full relative ${glowClass} rounded-sm`}
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
          {/* Side 1: Cover OR Commentary (rotateY = 0 or 360) */}
          <div className={`absolute inset-0 backface-hidden rounded-sm border overflow-hidden flex flex-col items-center justify-center p-2 ${!isRevealed ? 'bg-brand-dark border-brand-brown/20 text-brand-cream' : 'bg-[#FAF7F2] border-brand-brown/10 text-brand-brown'}`}>
            <div className={`absolute inset-0 card-texture ${!isRevealed ? 'opacity-20' : 'opacity-40'}`}></div>

            {/* Light reflection overlay */}
            {isHovering && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-20 rounded-sm"
                style={{
                  background: useTransform(
                    [sheenX, sheenY],
                    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
                  ),
                }}
              />
            )}

            <div className={`w-full h-full border relative p-1 ${!isRevealed ? 'border-brand-gold/30' : 'border-brand-brown/20'}`}>
              <div className={`w-full h-full border flex flex-col items-center justify-center p-6 relative ${!isRevealed ? 'border-brand-gold/10' : 'border-brand-brown/10'}`}>

                {!isRevealed ? (
                  // COVER DESIGN (Unopened)
                  <div className="flex flex-col items-center">
                    <motion.div
                      className="w-16 h-16 rounded-full border-[0.5px] border-brand-gold flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(184,144,71,0.2)]"
                      animate={{ boxShadow: ['0 0 15px rgba(184,144,71,0.1)', '0 0 25px rgba(184,144,71,0.3)', '0 0 15px rgba(184,144,71,0.1)'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <span className="font-serif text-brand-gold text-2xl">F</span>
                    </motion.div>
                    <span className="font-sans text-brand-gold/50 text-[10px] tracking-[0.4em] uppercase">Folio</span>
                  </div>
                ) : (
                  // COMMENTARY DESIGN (Flipped) — Between the Lines
                  <>
                    <div className="text-center mb-4 flex flex-col items-center w-full">
                      <div className="w-4 h-[1px] bg-brand-brown/40 mb-3"></div>
                      <h3 className="font-serif text-brand-brown/80 text-[10px] tracking-[0.3em] uppercase">Between the Lines</h3>
                      <p className="font-sans text-brand-brown/40 text-[8px] tracking-wide mt-2">{card.chapter}</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center w-full">
                      <p className="font-serif text-brand-brown text-[11px] leading-loose text-center tracking-wide">
                        {card.context}
                      </p>
                    </div>

                    <div className="mt-auto text-center pt-4 w-full flex flex-col items-center">
                      <div className="w-4 h-[1px] bg-brand-brown/20 mb-3"></div>
                      <span className="font-sans text-brand-gold text-[8px] font-medium tracking-[0.3em] uppercase">{card.rarity}</span>
                      <span className="font-sans text-brand-brown/30 text-[7px] tracking-[0.3em] uppercase mt-1">Folio Collection</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Side 2: Front / Quote (rotateY = 180) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-brand-cream rounded-sm border border-brand-brown/10 overflow-hidden flex flex-col items-center justify-center p-2">
            <div className="absolute inset-0 card-texture opacity-50"></div>

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
            <div className="w-full h-full border border-brand-gold/40 relative p-1">
              <div className="w-full h-full border border-brand-gold/20 flex flex-col items-center p-4 relative">

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand-gold"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-brand-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-brand-gold"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-brand-gold"></div>

                <div className="relative z-10 flex-1 flex flex-col w-full">
                  {/* Header: Author & Work */}
                  <div className="text-center mb-auto pt-2 flex flex-col items-center">
                    <div className="w-4 h-[1px] bg-brand-gold mb-3"></div>
                    <h3 className="font-serif text-brand-brown text-[10px] tracking-[0.3em] uppercase mb-1.5">{card.author}</h3>
                    <h4 className="font-serif text-brand-brown/70 text-xs italic tracking-widest">{card.work}</h4>
                  </div>

                  {/* Body: Quotes */}
                  <div className="flex-1 flex flex-col justify-center items-center text-center my-6 px-2">
                    <p className="font-serif text-brand-brown text-sm leading-relaxed mb-6 tracking-wide">
                      &ldquo;{card.originalQuote}&rdquo;
                    </p>
                    <div className="w-12 h-[1px] bg-brand-gold/40 mb-6"></div>
                    <p className="font-serif text-brand-brown/60 text-[11px] leading-relaxed">
                      {card.translatedQuote}
                    </p>
                  </div>

                  {/* Footer: Rarity & Logo */}
                  <div className="mt-auto pb-2 flex flex-col items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-[0.5px] border-brand-gold flex items-center justify-center">
                      <span className="font-serif text-brand-gold text-[10px]">F</span>
                    </div>
                    <span className="font-sans text-brand-gold text-[9px] font-medium tracking-[0.3em] uppercase">{card.rarity}</span>
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
