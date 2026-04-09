import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen } from 'lucide-react';
import Card from './Card';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { toUICard, type UICard } from '../lib/cardAdapter';
import { type CardData } from '../data/cards';
import { hasOpenedDailyPack, recordDailyPack } from '../lib/firestore';

const DRAW_COUNT = 5;
const DRAW_COST = 500;

interface EncounterProps {
  /** Pre-drawn cards injected from Boutique */
  injectedCards?: CardData[];
  injectedPackName?: string;
  /** Called when injected card flow finishes (all cards saved) */
  onInjectedComplete?: () => void;
}

export default function Encounter({ injectedCards, injectedPackName, onInjectedComplete }: EncounterProps = {}) {
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
  const [showingBTL, setShowingBTL] = useState(false);

  // Refs for syncing unsealing animation with async drawCards
  const pendingCardsRef = useRef<UICard[]>([]);
  const unsealAnimDoneRef = useRef(false);
  const [awaitingCards, setAwaitingCards] = useState(false);
  const isInjectedFlow = useRef(false);

  // Track whether unsealing animation has been triggered (to prevent re-runs)
  const unsealKeyRef = useRef(0);

  // Handle injected cards from Boutique — start unsealing immediately
  useEffect(() => {
    if (injectedCards && injectedCards.length > 0) {
      isInjectedFlow.current = true;
      pendingCardsRef.current = injectedCards.map((c, i) => toUICard(c, i + 1));
      unsealAnimDoneRef.current = false;
      unsealKeyRef.current += 1;
      setPackState('unsealing');
    }
  }, [injectedCards]);

  // Transition to empty state when all cards are saved
  useEffect(() => {
    if (packState === 'opened' && drawnCards.length > 0 && savedCards.length === drawnCards.length) {
      const timer = setTimeout(() => {
        setPackState('empty');
        setSavedCards([]);
        setRevealedCards([]);
        setDrawnCards([]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [savedCards, packState, drawnCards.length]);

  const transitionToOpened = () => {
    if (pendingCardsRef.current.length > 0) {
      setAwaitingCards(false);
      setDrawnCards(pendingCardsRef.current);
      pendingCardsRef.current = [];
      unsealAnimDoneRef.current = false;
      setPackState('opened');
    }
  };

  const handleOpenPack = async (free: boolean = false) => {
    if (loading) return;
    if (!free && points < DRAW_COST) return;

    // Reset refs
    pendingCardsRef.current = [];
    unsealAnimDoneRef.current = false;
    setAwaitingCards(false);

    // Phase 1: Unsealing animation starts
    unsealKeyRef.current += 1;
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

    // Store cards; if animation already done, transition immediately
    pendingCardsRef.current = cards.map((c, i) => toUICard(c, i + 1));
    if (unsealAnimDoneRef.current) {
      transitionToOpened();
    }
  };

  const handleCardClick = (id: number) => {
    if (focusedCard === null) {
      setFocusedCard(id);
      setShowingBTL(false);

      if (!revealedCards.includes(id)) {
        setIsFlipping(true);
      }
    } else if (focusedCard === id) {
      if (revealedCards.includes(id) && !isFlipping) {
        if (showingBTL) {
          handleSaveCard(id);
        } else {
          setShowingBTL(true);
        }
      }
    }
  };

  const handleSaveCard = (id: number) => {
    setSavingCard(id);
  };

  const handleReset = () => {
    if (isInjectedFlow.current) {
      isInjectedFlow.current = false;
      onInjectedComplete?.();
      return;
    }
    setPackState('unopened');
    setDrawnCards([]);
    setSavedCards([]);
    setRevealedCards([]);
    setFocusedCard(null);
    setShowingBTL(false);
  };

  const canAfford = points >= DRAW_COST;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative">

      {/* ═══ UNOPENED — Sealed Envelope ═══ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-opacity duration-200 ease-out ${
          packState === 'unopened' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
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
          <div
            className="relative z-10 w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center border border-brand-brown/10"
            style={{ boxShadow: '0 8px 25px rgba(26,17,10,0.3), inset 0 1px 2px rgba(255,255,255,0.3)' }}
          >
            {/* Gold glow overlay — opacity-only animation for GPU compositing */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ boxShadow: '0 8px 35px rgba(184,144,71,0.4), inset 0 1px 2px rgba(255,255,255,0.4)' }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="w-16 h-16 rounded-full border-[0.5px] border-brand-brown flex items-center justify-center">
              <span className="font-serif text-brand-brown text-2xl">F</span>
            </div>
          </div>

          <div className="absolute bottom-6 w-full text-center z-10">
            <p className="text-brand-cream font-serif text-[10px] tracking-[0.3em] uppercase opacity-90">
              {dailyAvailable ? 'Daily Encounter' : 'Premi\u00e8re Edition'}
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
              <span className="text-brand-brown/30 text-[9px] tracking-[0.2em]">Tap to Break the Seal &middot; {DRAW_COUNT} Cards</span>
            </>
          ) : canAfford ? (
            <>
              <span className="text-brand-brown/40 text-[10px] tracking-[0.3em] uppercase">Tap to Break the Seal</span>
              <span className="text-brand-brown/30 text-[9px] tracking-[0.2em]">{DRAW_COST} Pts &middot; {DRAW_COUNT} Cards</span>
            </>
          ) : (
            <>
              <span className="text-brand-orange/60 text-[10px] tracking-[0.3em] uppercase">Not Enough Points</span>
              <span className="text-brand-brown/30 text-[9px] tracking-[0.2em]">{DRAW_COST} Pts &middot; Daily pack used</span>
            </>
          )}
        </div>
      </div>

      {/* ═══ UNSEALING — Elegant Seal Lift ═══ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-6 ${
          packState === 'unsealing' ? 'z-10' : 'z-0 pointer-events-none'
        }`}
        style={{ opacity: packState === 'unsealing' ? 1 : 0 }}
      >
        {/* Key forces re-mount so animation replays each time */}
        <motion.div
          key={unsealKeyRef.current}
          className="relative w-64 h-80 rounded-sm overflow-hidden bg-brand-orange flex flex-col items-center justify-center border border-brand-brown/5"
          style={{ boxShadow: '0 20px 50px rgba(26,17,10,0.2)' }}
          animate={{ scale: [1, 1.03, 0.92], opacity: [1, 1, 0] }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], times: [0, 0.35, 1] }}
          onAnimationComplete={() => {
            unsealAnimDoneRef.current = true;
            if (pendingCardsRef.current.length > 0) {
              transitionToOpened();
            } else {
              setAwaitingCards(true);
            }
          }}
        >
          <div className="absolute inset-0 card-texture opacity-30 mix-blend-multiply"></div>

          {/* Ribbons — slide apart simultaneously */}
          <motion.div
            className="absolute top-0 bottom-0 left-1/2 w-10 bg-brand-brown shadow-lg"
            style={{ x: '-50%' }}
            animate={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          />
          <motion.div
            className="absolute left-0 right-0 top-1/2 h-10 bg-brand-brown shadow-lg"
            style={{ y: '-50%' }}
            animate={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Wax seal — pops up and fades together with ribbons */}
          <motion.div
            className="relative z-10 w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center border border-brand-brown/10"
            style={{ boxShadow: '0 8px 25px rgba(26,17,10,0.3)' }}
            animate={{
              y: -12,
              scale: 0.85,
              opacity: 0,
            }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="w-16 h-16 rounded-full border-[0.5px] border-brand-brown flex items-center justify-center">
              <span className="font-serif text-brand-brown text-2xl">F</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Subtle loading indicator when animation finished but cards not yet ready */}
        {awaitingCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center mt-8"
          >
            <motion.div
              className="w-10 h-10 rounded-full border border-brand-brown/15 flex items-center justify-center"
              animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="font-serif text-brand-brown/30 text-sm">F</span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* ═══ OPENED — Cards Spread ═══ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-start pt-16 p-6 ${
          packState === 'opened' && drawnCards.length > 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        {/* Header — always above cards */}
        <div className="flex flex-col items-center mb-8 relative z-30">
          <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">
            {injectedPackName || 'Revealed'}
          </span>
          <h2 className="font-serif text-xl tracking-[0.2em] uppercase text-brand-brown">Masterpieces</h2>
          <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
        </div>

        {/* Overlay for focused card — split into backdrop + card layer */}
        <AnimatePresence>
          {focusedCard !== null && (
            <>
              {/* Backdrop — fades out when saving so card flies over fan */}
              <motion.div
                key="overlay-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: savingCard !== null ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed inset-0 bg-brand-cream/[0.98] z-[100]"
              />

              {/* Card layer — stays visible during flight */}
              <motion.div
                key="overlay-card"
                className="fixed inset-0 z-[101] flex flex-col items-center justify-center pointer-events-none"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <motion.div
                  layoutId={`card-${focusedCard}`}
                  className="relative pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!savingCard) handleCardClick(focusedCard);
                  }}
                  animate={savingCard === focusedCard ? {
                    y: [0, -40, window.innerHeight * 0.5],
                    x: [0, 0, -(window.innerWidth * 0.12)],
                    scale: [1, 1.06, 0.08],
                    opacity: [1, 1, 0],
                    rotate: [0, -2, 10],
                  } : {}}
                  transition={savingCard === focusedCard ? {
                    duration: 0.9,
                    ease: [0.32, 0, 0.15, 1],
                    times: [0, 0.25, 1],
                  } : {}}
                  onAnimationComplete={() => {
                    if (savingCard !== null) {
                      setSavedCards(prev => [...prev, savingCard]);
                      setSavingCard(null);
                      setFocusedCard(null);
                      setShowingBTL(false);
                    }
                  }}
                >
                  <Card
                    card={drawnCards.find(c => c.id === focusedCard)!}
                    isRevealed={revealedCards.includes(focusedCard)}
                    isFlipped={showingBTL}
                    onFlipComplete={() => {
                      if (isFlipping && focusedCard !== null) {
                        setRevealedCards(prev => [...prev, focusedCard]);
                        setIsFlipping(false);
                      }
                    }}
                  />
                </motion.div>

                <div className="mt-12 text-center pointer-events-none">
                  <AnimatePresence mode="wait">
                    {savingCard === focusedCard ? (
                      <motion.span
                        key="saving"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="font-sans text-brand-orange text-[10px] tracking-[0.2em] uppercase font-medium"
                      >
                        Saving to Library...
                      </motion.span>
                    ) : showingBTL ? (
                      <motion.span
                        key="save"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="font-sans text-brand-brown/60 text-[10px] tracking-[0.2em] uppercase"
                      >
                        Tap to save to library
                      </motion.span>
                    ) : revealedCards.includes(focusedCard) && !isFlipping ? (
                      <motion.span
                        key="btl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="font-sans text-brand-brown/60 text-[10px] tracking-[0.2em] uppercase"
                      >
                        Tap to read Between the Lines
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
            </>
          )}
        </AnimatePresence>

        {/* Fan Layout — fixed-height container, cards centered within */}
        <div className="relative w-full flex items-center justify-center -mt-10" style={{ height: 230, overflow: 'visible' }}>
          {drawnCards.length > 0 && (() => {
            const unsaved = drawnCards.filter(c => !savedCards.includes(c.id));
            const total = unsaved.length;

            return unsaved.map((card, unsavedIdx) => {
              const isFocused = focusedCard === card.id;
              const isRevealed = revealedCards.includes(card.id);

              // Dynamic fan spread based on remaining card count
              const center = (total - 1) / 2;
              const offset = unsavedIdx - center;
              const angle = offset * 8;
              const x = offset * 45;
              const yArc = Math.abs(offset) * 3;

              return (
                <motion.div
                  key={card.id}
                  layoutId={`card-${card.id}`}
                  layout
                  className="absolute"
                  style={{ originX: 0.5, originY: 1 }}
                  initial={{ y: 120, opacity: 0, rotate: 0, scale: 0.4 }}
                  animate={{
                    x: isFocused ? 0 : x,
                    y: isFocused ? 0 : yArc,
                    rotate: isFocused ? 0 : angle,
                    scale: isFocused ? 1 : 0.5,
                    zIndex: isFocused ? 50 : unsavedIdx,
                    opacity: isFocused ? 0 : 1
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 220,
                    damping: 22,
                    mass: 0.6,
                    delay: isFocused ? 0 : (savedCards.length === 0 ? unsavedIdx * 0.03 : 0),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(card.id);
                  }}
                >
                  <Card
                    card={card}
                    isRevealed={isRevealed}
                    compact
                  />
                </motion.div>
              );
            });
          })()}
        </div>
      </div>

      {/* ═══ EMPTY — All Cards Saved ═══ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-opacity duration-300 ease-out ${
          packState === 'empty' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={packState === 'empty' ? { scale: 1, opacity: 0.6 } : { scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', delay: 0.15 }}
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
          {isInjectedFlow.current ? 'Back to Boutique' : canAfford ? 'Open Another Pack' : 'Back to Encounter'}
        </button>
      </div>
    </div>
  );
}
