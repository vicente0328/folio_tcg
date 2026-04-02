import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen } from 'lucide-react';
import Card from './Card';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { toUICard, type UICard } from '../lib/cardAdapter';
import { hasOpenedDailyPack, recordDailyPack } from '../lib/firestore';

const DRAW_COUNT = 5;
const DRAW_COST = 500;

export default function Encounter() {
  const { drawCards, points, loading } = useGame();
  const { user } = useAuth();
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [checkingDaily, setCheckingDaily] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const opened = await hasOpenedDailyPack(user.uid);
      setDailyAvailable(!opened);
      setCheckingDaily(false);
    })();
  }, [user]);

  const [packState, setPackState] = useState<'unopened' | 'unsealing' | 'opened' | 'empty'>('unopened');
  const [drawnCards, setDrawnCards] = useState<UICard[]>([]);

  // Card interaction states
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [savedCards, setSavedCards] = useState<number[]>([]);
  const [savingCard, setSavingCard] = useState<number | null>(null);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showBTL, setShowBTL] = useState(false);

  // Transition to empty state when all cards are saved
  useEffect(() => {
    if (packState === 'opened' && drawnCards.length > 0 && savedCards.length === drawnCards.length) {
      const timer = setTimeout(() => {
        setPackState('empty');
        setSavedCards([]);
        setRevealedCards([]);
        setDrawnCards([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [savedCards, packState, drawnCards.length]);

  const handleOpenPack = async (free: boolean = false) => {
    if (loading) return;
    if (!free && points < DRAW_COST) return;

    // Phase 1: Unsealing animation
    setPackState('unsealing');

    const cost = free ? 0 : DRAW_COST;
    const cards = await drawCards(DRAW_COUNT, cost);
    if (cards.length === 0) {
      setPackState('unopened');
      return;
    }
    if (free && user) {
      await recordDailyPack(user.uid);
      setDailyAvailable(false);
    }

    // Wait for unsealing animation, then reveal cards
    setTimeout(() => {
      setDrawnCards(cards.map((c, i) => toUICard(c, i + 1)));
      setPackState('opened');
    }, 2000);
  };

  const handleCardClick = (id: number) => {
    if (focusedCard === null) {
      setFocusedCard(id);
      setShowBTL(false);

      if (!revealedCards.includes(id)) {
        setIsFlipping(true);
        setTimeout(() => {
          setRevealedCards(prev => [...prev, id]);
          setIsFlipping(false);
        }, 800);
      }
    } else if (focusedCard === id) {
      if (revealedCards.includes(id) && !isFlipping) {
        if (showBTL) {
          handleSaveCard(id);
        } else {
          setShowBTL(true);
        }
      }
    }
  };

  const handleSaveCard = (id: number) => {
    setSavingCard(id);
    // Wait for binder animation to complete
    setTimeout(() => {
      setSavedCards(prev => [...prev, id]);
      setSavingCard(null);
      setFocusedCard(null);
      setShowBTL(false);
    }, 800);
  };

  const handleReset = () => {
    setPackState('unopened');
    setDrawnCards([]);
    setSavedCards([]);
    setRevealedCards([]);
    setFocusedCard(null);
    setShowBTL(false);
  };

  const canAfford = points >= DRAW_COST;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* ═══ Binder indicator — visible when cards are being saved ═══ */}
      <AnimatePresence>
        {packState === 'opened' && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ delay: 0.5, type: 'spring', damping: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center pointer-events-none"
          >
            <motion.div
              className="w-12 h-12 rounded-full bg-brand-brown/10 backdrop-blur-sm border border-brand-brown/20 flex items-center justify-center"
              animate={savingCard !== null ? {
                scale: [1, 1.3, 1],
                backgroundColor: ['rgba(26,17,10,0.1)', 'rgba(224,90,0,0.2)', 'rgba(26,17,10,0.1)'],
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <BookOpen size={18} className="text-brand-brown/50" strokeWidth={1.5} />
            </motion.div>
            <motion.span
              className="text-[8px] tracking-[0.2em] uppercase text-brand-brown/40 mt-2"
              animate={savingCard !== null ? { opacity: [0.4, 1, 0.4] } : {}}
            >
              My Library
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ═══ UNOPENED — Sealed Envelope ═══ */}
        {packState === 'unopened' && (
          <motion.div
            key="unopened"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full"
          >
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">New Arrival</span>
              <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Encounter</h2>
              <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
            </div>

            {/* Sealed Envelope */}
            <motion.div
              className={`relative w-64 h-80 rounded-sm overflow-hidden bg-brand-orange group flex flex-col items-center justify-center border border-brand-brown/5 cursor-pointer ${!dailyAvailable && !canAfford ? 'opacity-50 cursor-default' : ''}`}
              onClick={() => dailyAvailable ? handleOpenPack(true) : canAfford ? handleOpenPack(false) : undefined}
              whileTap={dailyAvailable || canAfford ? { scale: 0.97 } : {}}
              style={{ boxShadow: '0 20px 50px rgba(26,17,10,0.2)' }}
            >
              <div className="absolute inset-0 card-texture opacity-30 mix-blend-multiply"></div>

              {/* Ribbon cross */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 bg-brand-brown shadow-lg"></div>
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 bg-brand-brown shadow-lg"></div>

              {/* Wax Seal */}
              <motion.div
                className="relative z-10 w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center border border-brand-brown/10"
                style={{ boxShadow: '0 8px 25px rgba(26,17,10,0.3), inset 0 1px 2px rgba(255,255,255,0.3)' }}
                animate={{
                  boxShadow: [
                    '0 8px 25px rgba(26,17,10,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
                    '0 8px 35px rgba(184,144,71,0.3), inset 0 1px 2px rgba(255,255,255,0.4)',
                    '0 8px 25px rgba(26,17,10,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-16 h-16 rounded-full border-[0.5px] border-brand-brown flex items-center justify-center">
                  <span className="font-serif text-brand-brown text-2xl">F</span>
                </div>
              </motion.div>

              <div className="absolute bottom-6 w-full text-center z-10">
                <p className="text-brand-cream font-serif text-[10px] tracking-[0.3em] uppercase opacity-90">
                  {dailyAvailable ? 'Daily Encounter' : 'Première Edition'}
                </p>
              </div>

              {/* Travelling shine */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
              />
            </motion.div>

            <div className="mt-12 flex flex-col items-center gap-2">
              {checkingDaily ? (
                <span className="text-brand-brown/30 text-[10px] tracking-[0.3em] uppercase">Loading...</span>
              ) : dailyAvailable ? (
                <>
                  <span className="text-brand-orange text-[10px] tracking-[0.3em] uppercase font-medium">Free Daily Pack</span>
                  <span className="text-brand-brown/30 text-[9px] tracking-[0.2em]">Tap to Break the Seal · {DRAW_COUNT} Cards</span>
                </>
              ) : canAfford ? (
                <>
                  <span className="text-brand-brown/40 text-[10px] tracking-[0.3em] uppercase">Tap to Break the Seal</span>
                  <span className="text-brand-brown/30 text-[9px] tracking-[0.2em]">{DRAW_COST} Pts · {DRAW_COUNT} Cards</span>
                </>
              ) : (
                <>
                  <span className="text-brand-orange/60 text-[10px] tracking-[0.3em] uppercase">Not Enough Points</span>
                  <span className="text-brand-brown/30 text-[9px] tracking-[0.2em]">{DRAW_COST} Pts · Daily pack used</span>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ UNSEALING — Wax Seal Breaking ═══ */}
        {packState === 'unsealing' && (
          <motion.div
            key="unsealing"
            initial={{ opacity: 1 }}
            className="flex flex-col items-center w-full"
          >
            <div className="mb-12 flex flex-col items-center text-center">
              <motion.span
                className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Unsealing
              </motion.span>
              <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Encounter</h2>
              <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
            </div>

            <div className="relative w-64 h-80 rounded-sm overflow-hidden bg-brand-orange flex flex-col items-center justify-center border border-brand-brown/5"
              style={{ boxShadow: '0 20px 50px rgba(26,17,10,0.2)' }}
            >
              <div className="absolute inset-0 card-texture opacity-30 mix-blend-multiply"></div>

              {/* Ribbons splitting open */}
              <motion.div
                className="absolute top-0 bottom-0 left-1/2 w-10 bg-brand-brown shadow-lg origin-center"
                animate={{ scaleX: [1, 1.2, 0], opacity: [1, 1, 0] }}
                transition={{ duration: 1.2, ease: 'easeIn', delay: 0.3 }}
                style={{ x: '-50%' }}
              />
              <motion.div
                className="absolute left-0 right-0 top-1/2 h-10 bg-brand-brown shadow-lg origin-center"
                animate={{ scaleY: [1, 1.2, 0], opacity: [1, 1, 0] }}
                transition={{ duration: 1.2, ease: 'easeIn', delay: 0.3 }}
                style={{ y: '-50%' }}
              />

              {/* Wax seal cracking and fading */}
              <motion.div
                className="relative z-10 w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center border border-brand-brown/10"
                style={{ boxShadow: '0 8px 25px rgba(26,17,10,0.3)' }}
                animate={{
                  scale: [1, 1.1, 1.15, 0],
                  rotate: [0, -5, 8, 0],
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
              >
                <div className="w-16 h-16 rounded-full border-[0.5px] border-brand-brown flex items-center justify-center">
                  <span className="font-serif text-brand-brown text-2xl">F</span>
                </div>
              </motion.div>

              {/* Crack lines radiating from seal */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <motion.div
                  key={angle}
                  className="absolute w-[1px] h-0 bg-brand-brown/60 origin-top"
                  style={{
                    top: '50%',
                    left: '50%',
                    rotate: `${angle}deg`,
                  }}
                  animate={{ height: [0, 60, 80], opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                />
              ))}

              {/* Envelope unfurling — top flap */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-1/2 bg-brand-orange border-b border-brand-brown/20 origin-bottom"
                animate={{ rotateX: [0, 0, -180], opacity: [0, 0, 0.5] }}
                transition={{ duration: 0.8, delay: 1.2, ease: 'easeInOut' }}
              />

              {/* Light burst from inside */}
              <motion.div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(circle at center, rgba(251,249,246,0.9) 0%, transparent 70%)' }}
                animate={{ opacity: [0, 0, 1, 0], scale: [0.5, 0.5, 1.5, 2] }}
                transition={{ duration: 1, delay: 1.4, ease: 'easeOut' }}
              />
            </div>

            <div className="mt-12 flex flex-col items-center gap-2">
              <motion.span
                className="text-brand-brown/40 text-[10px] tracking-[0.3em] uppercase"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Breaking the seal...
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* ═══ OPENED — Cards Spread ═══ */}
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
                  onClick={() => { if (!savingCard) setFocusedCard(null); }}
                >
                  <motion.div
                    layoutId={`card-${focusedCard}`}
                    className="relative z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!savingCard) handleCardClick(focusedCard);
                    }}
                    animate={savingCard === focusedCard ? {
                      // Fly down into the binder
                      y: [0, -30, window.innerHeight * 0.4],
                      x: [0, 0, 0],
                      scale: [1, 1.05, 0.15],
                      opacity: [1, 1, 0],
                      rotate: [0, -3, 5],
                    } : {}}
                    transition={savingCard === focusedCard ? {
                      duration: 0.8,
                      ease: [0.45, 0, 0.55, 1],
                      times: [0, 0.2, 1],
                    } : {}}
                  >
                    <Card
                      card={drawnCards.find(c => c.id === focusedCard)!}
                      isRevealed={revealedCards.includes(focusedCard)}
                      showBTL={showBTL}
                    />
                  </motion.div>

                  <div className="mt-12 text-center">
                    <AnimatePresence mode="wait">
                      {savingCard === focusedCard ? (
                        <motion.span
                          key="saving"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="font-sans text-brand-orange text-[10px] tracking-[0.2em] uppercase font-medium"
                        >
                          Saving to Library...
                        </motion.span>
                      ) : showBTL ? (
                        <motion.span
                          key="save"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="font-sans text-brand-brown/60 text-[10px] tracking-[0.2em] uppercase"
                        >
                          Tap card to save to library
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

            {/* Fan Layout — cards emerge from center */}
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
                    initial={{ y: 200, opacity: 0, rotate: 0, scale: 0.3 }}
                    animate={{
                      x: isFocused ? 0 : xOffsets[index],
                      y: isFocused ? 0 : yOffsets[index] + 20,
                      rotate: isFocused ? 0 : angles[index],
                      scale: isFocused ? 1 : 0.6,
                      zIndex: isFocused ? 50 : index,
                      opacity: isFocused ? 0 : 1
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 180,
                      damping: 18,
                      delay: isFocused ? 0 : index * 0.12,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(card.id);
                    }}
                  >
                    <Card
                      card={card}
                      isRevealed={isRevealed}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ EMPTY — All Cards Saved ═══ */}
        {packState === 'empty' && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full h-full flex flex-col items-center justify-center text-center px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ type: 'spring', delay: 0.3 }}
              className="w-16 h-16 mb-8 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center"
            >
              <BookOpen size={24} className="text-brand-brown" strokeWidth={1} />
            </motion.div>
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
