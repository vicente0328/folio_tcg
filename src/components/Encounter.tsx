import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from './Card';
import { useGame } from '../context/GameContext';
import { toUICard, type UICard } from '../lib/cardAdapter';

const DRAW_COUNT = 5;
const DRAW_COST = 500;

export default function Encounter() {
  const { drawCards, points } = useGame();
  const [packState, setPackState] = useState<'unopened' | 'opened' | 'empty'>('unopened');
  const [drawnCards, setDrawnCards] = useState<UICard[]>([]);

  // Card interaction states
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [savedCards, setSavedCards] = useState<number[]>([]);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showingCommentary, setShowingCommentary] = useState(false);

  // Transition to empty state when all cards are saved
  useEffect(() => {
    if (packState === 'opened' && drawnCards.length > 0 && savedCards.length === drawnCards.length) {
      const timer = setTimeout(() => {
        setPackState('empty');
        setSavedCards([]);
        setRevealedCards([]);
        setDrawnCards([]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [savedCards, packState, drawnCards.length]);

  const handleOpenPack = async () => {
    if (points < DRAW_COST) return;
    const cards = await drawCards(DRAW_COUNT, DRAW_COST);
    if (cards.length === 0) return;
    setDrawnCards(cards.map((c, i) => toUICard(c, i + 1)));
    setPackState('opened');
  };

  const handleCardClick = (id: number) => {
    if (focusedCard === null) {
      setFocusedCard(id);
      setShowingCommentary(false);

      if (!revealedCards.includes(id)) {
        setIsFlipping(true);
        setTimeout(() => {
          setRevealedCards(prev => [...prev, id]);
          setIsFlipping(false);
        }, 800);
      }
    } else if (focusedCard === id) {
      if (revealedCards.includes(id) && !isFlipping) {
        if (showingCommentary) {
          handleSaveCard(id);
        } else {
          setShowingCommentary(true);
        }
      }
    }
  };

  const handleSaveCard = (id: number) => {
    setSavedCards(prev => [...prev, id]);
    setFocusedCard(null);
    setShowingCommentary(false);
  };

  const handleReset = () => {
    setPackState('unopened');
    setDrawnCards([]);
    setSavedCards([]);
    setRevealedCards([]);
    setFocusedCard(null);
    setShowingCommentary(false);
  };

  const canAfford = points >= DRAW_COST;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative">
      <AnimatePresence mode="wait">
        {packState === 'unopened' && (
          <motion.div
            key="unopened"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            className="flex flex-col items-center cursor-pointer w-full"
            onClick={canAfford ? handleOpenPack : undefined}
          >
            {/* Header Title for Symmetry */}
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">New Arrival</span>
              <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Encounter</h2>
              <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
            </div>

            {/* Luxury Box / Envelope Design */}
            <div className={`relative w-64 h-80 rounded-sm shadow-[0_20px_50px_rgba(26,17,10,0.2)] overflow-hidden bg-brand-orange group flex flex-col items-center justify-center border border-brand-brown/5 ${!canAfford ? 'opacity-50' : ''}`}>
              <div className="absolute inset-0 card-texture opacity-30 mix-blend-multiply"></div>

              {/* Symmetrical Ribbon */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 bg-brand-brown shadow-lg"></div>
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 bg-brand-brown shadow-lg"></div>

              {/* Center Seal */}
              <div className="relative z-10 w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center shadow-xl border border-brand-brown/10">
                <div className="w-16 h-16 rounded-full border-[0.5px] border-brand-brown flex items-center justify-center">
                  <span className="font-serif text-brand-brown text-2xl">F</span>
                </div>
              </div>

              {/* Box Text */}
              <div className="absolute bottom-6 w-full text-center z-10">
                <p className="text-brand-cream font-serif text-[10px] tracking-[0.3em] uppercase opacity-90">Première Edition</p>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full"></div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-2">
              {canAfford ? (
                <span className="text-brand-brown/40 text-[10px] tracking-[0.3em] uppercase">Tap to Unseal</span>
              ) : (
                <span className="text-brand-orange/60 text-[10px] tracking-[0.3em] uppercase">Not Enough Points</span>
              )}
              <span className="text-brand-brown/30 text-[9px] tracking-[0.2em]">{DRAW_COST} Pts · {DRAW_COUNT} Cards</span>
            </div>
          </motion.div>
        )}

        {packState === 'opened' && drawnCards.length > 0 && (
          <motion.div
            key="opened"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col pt-8 pb-8 relative"
          >
            <div className="flex flex-col items-center mb-4 relative z-10">
              <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">Revealed</span>
              <h2 className="font-serif text-xl tracking-[0.2em] uppercase text-brand-brown">Masterpieces</h2>
              <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
            </div>

            {/* Overlay for focused card */}
            <AnimatePresence>
              {focusedCard !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-brand-cream/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center"
                  onClick={() => setFocusedCard(null)}
                >
                  <motion.div
                    layoutId={`card-${focusedCard}`}
                    className="relative z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(focusedCard);
                    }}
                    animate={savedCards.includes(focusedCard) ? {
                      y: 500,
                      scale: 0.2,
                      opacity: 0,
                      rotate: 15
                    } : {}}
                    transition={{ duration: 0.6, ease: "backIn" }}
                  >
                    <Card
                      card={drawnCards.find(c => c.id === focusedCard)!}
                      isRevealed={revealedCards.includes(focusedCard)}
                      isFlipped={showingCommentary}
                    />
                  </motion.div>

                  <div className="mt-12 text-center">
                    <AnimatePresence mode="wait">
                      {showingCommentary ? (
                        <motion.span
                          key="save"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="font-sans text-brand-brown/60 text-[10px] tracking-[0.2em] uppercase"
                        >
                          Tap card again to save to library
                        </motion.span>
                      ) : revealedCards.includes(focusedCard) && !isFlipping ? (
                        <motion.span
                          key="flip"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="font-sans text-brand-brown/60 text-[10px] tracking-[0.2em] uppercase"
                        >
                          Tap card to read commentary
                        </motion.span>
                      ) : (
                        <motion.span
                          key="revealing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-sans text-brand-brown/60 text-[10px] tracking-[0.2em] uppercase"
                        >
                          Revealing...
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fan Layout */}
            <div className="relative w-full flex-1 flex items-center justify-center mt-40">
              {drawnCards.map((card, index) => {
                if (savedCards.includes(card.id)) return null;

                const isFocused = focusedCard === card.id;
                const isRevealed = revealedCards.includes(card.id);

                const angles = [-20, -10, 0, 10, 20];
                const xOffsets = [-70, -35, 0, 35, 70];
                const yOffsets = [30, 10, 0, 10, 30];

                return (
                  <motion.div
                    key={card.id}
                    layoutId={`card-${card.id}`}
                    className="absolute"
                    initial={{ y: 300, opacity: 0, rotate: 0 }}
                    animate={{
                      x: isFocused ? 0 : xOffsets[index],
                      y: isFocused ? 0 : yOffsets[index] + 20,
                      rotate: isFocused ? 0 : angles[index],
                      scale: isFocused ? 1 : 0.6,
                      zIndex: isFocused ? 50 : index,
                      opacity: isFocused ? 0 : 1
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      delay: isFocused ? 0 : index * 0.1
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(card.id);
                    }}
                  >
                    <Card
                      card={card}
                      isRevealed={isRevealed}
                      isFlipped={false}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {packState === 'empty' && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center justify-center text-center px-4"
          >
            <div className="w-16 h-16 mb-8 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center opacity-60">
              <span className="font-serif text-brand-brown text-xl">F</span>
            </div>
            <h3 className="font-serif text-lg tracking-[0.2em] uppercase mb-4 text-brand-brown">Cards Saved to Library</h3>
            <div className="w-8 h-[1px] bg-brand-brown/20 mb-6"></div>
            <p className="text-[11px] text-brand-brown/60 mb-12 max-w-[240px] leading-relaxed tracking-wide">
              {canAfford
                ? 'Open another pack or visit the Library to view your collection.'
                : 'Visit the Boutique to acquire more points, or explore the Exchange for rare finds.'}
            </p>

            <button
              onClick={handleReset}
              className="bg-transparent border border-brand-brown text-brand-brown px-8 py-2.5 rounded-sm text-[9px] tracking-[0.2em] uppercase font-medium hover:bg-brand-brown hover:text-brand-cream transition-colors duration-500"
            >
              {canAfford ? 'Open Another Pack' : 'Back to Encounter'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
