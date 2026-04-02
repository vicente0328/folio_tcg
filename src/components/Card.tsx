import { motion } from 'motion/react';

interface CardProps {
  card: {
    id: number;
    author: string;
    work: string;
    originalQuote: string;
    translatedQuote: string;
    context: string;
    rarity: string;
  };
  isRevealed: boolean;
  isFlipped: boolean;
}

export default function Card({ card, isRevealed, isFlipped }: CardProps) {
  // rotateY logic:
  // !isRevealed -> 0 (Side 1: Cover)
  // isRevealed && !isFlipped -> 180 (Side 2: Front/Quote)
  // isRevealed && isFlipped -> 360 (Side 1: Back/Commentary)

  let rotateY = 0;
  if (isRevealed) {
    rotateY = isFlipped ? 360 : 180;
  }

  return (
    <div className="w-64 h-[400px] perspective-1000 group">
      <motion.div
        className="w-full h-full relative transform-style-3d"
        animate={{ rotateY }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Side 1: Cover OR Commentary (rotateY = 0 or 360) */}
        <div className={`absolute inset-0 backface-hidden rounded-sm shadow-[0_15px_35px_rgba(26,17,10,0.3)] border overflow-hidden flex flex-col items-center justify-center p-2 ${!isRevealed ? 'bg-brand-dark border-brand-brown/20 text-brand-cream' : 'bg-[#FAF7F2] border-brand-brown/10 text-brand-brown'}`}>
          <div className={`absolute inset-0 card-texture ${!isRevealed ? 'opacity-20' : 'opacity-40'}`}></div>

          <div className={`w-full h-full border relative p-1 ${!isRevealed ? 'border-brand-gold/30' : 'border-brand-brown/20'}`}>
            <div className={`w-full h-full border flex flex-col items-center justify-center p-6 relative ${!isRevealed ? 'border-brand-gold/10' : 'border-brand-brown/10'}`}>

              {!isRevealed ? (
                // COVER DESIGN (Unopened)
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-[0.5px] border-brand-gold flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(184,144,71,0.2)]">
                    <span className="font-serif text-brand-gold text-2xl">F</span>
                  </div>
                  <span className="font-sans text-brand-gold/50 text-[10px] tracking-[0.4em] uppercase">Folio</span>
                </div>
              ) : (
                // COMMENTARY DESIGN (Flipped)
                <>
                  <div className="text-center mb-6 flex flex-col items-center w-full">
                    <div className="w-4 h-[1px] bg-brand-brown/40 mb-4"></div>
                    <h3 className="font-serif text-brand-brown/80 text-[10px] tracking-[0.3em] uppercase">Commentary</h3>
                  </div>

                  <div className="flex-1 flex flex-col justify-center w-full">
                    <p className="font-serif text-brand-brown text-[12px] leading-loose text-center tracking-wide">
                      {card.context}
                    </p>
                  </div>

                  <div className="mt-auto text-center pt-6 w-full flex flex-col items-center">
                    <div className="w-4 h-[1px] bg-brand-brown/20 mb-4"></div>
                    <span className="font-sans text-brand-brown/40 text-[8px] tracking-[0.4em] uppercase">Folio Collection</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side 2: Front / Quote (rotateY = 180) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-brand-cream rounded-sm shadow-[0_15px_35px_rgba(26,17,10,0.15)] border border-brand-brown/10 overflow-hidden flex flex-col items-center justify-center p-2">
          <div className="absolute inset-0 card-texture opacity-50"></div>

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
                    "{card.originalQuote}"
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

          {/* Subtle Foil effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full pointer-events-none"></div>
        </div>
      </motion.div>
    </div>
  );
}
