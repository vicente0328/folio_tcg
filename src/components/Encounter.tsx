import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from './Card';

const mockCards = [
  {
    id: 1,
    author: "Albert Camus",
    work: "L'Étranger",
    originalQuote: "Aujourd'hui, maman est morte. Ou peut-être hier, je ne sais pas.",
    translatedQuote: "오늘 엄마가 죽었다. 아니 어쩌면 어제, 잘 모르겠다.",
    context: "소설의 첫 문장으로, 뫼르소의 무관심하고 부조리한 세계관을 단적으로 보여줍니다.",
    rarity: "SSR"
  },
  {
    id: 2,
    author: "Fyodor Dostoevsky",
    work: "Crime and Punishment",
    originalQuote: "Тварь ли я дрожащая или право имею...",
    translatedQuote: "나는 떨고 있는 미물인가, 아니면 권리를 가지고 있는가...",
    context: "라스콜니코프가 자신의 초인 사상을 시험하기 위해 살인을 저지른 후 겪는 내적 갈등을 나타냅니다.",
    rarity: "SR"
  },
  {
    id: 3,
    author: "Jane Austen",
    work: "Pride and Prejudice",
    originalQuote: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    translatedQuote: "재산이 많은 독신 남자라면 아내가 필요할 것이라는 점은 누구나 인정하는 보편적인 진리이다.",
    context: "당대 영국의 결혼 풍속도를 풍자적으로 꼬집는 유명한 첫 문장입니다.",
    rarity: "R"
  },
  {
    id: 4,
    author: "Herman Melville",
    work: "Moby-Dick",
    originalQuote: "Call me Ishmael.",
    translatedQuote: "나를 이스마엘이라 부르라.",
    context: "거대한 자연 앞에서의 인간의 운명과 탐구를 다룬 대서사시의 장엄한 시작을 알립니다.",
    rarity: "SR"
  },
  {
    id: 5,
    author: "Leo Tolstoy",
    work: "Anna Karenina",
    originalQuote: "All happy families are alike; each unhappy family is unhappy in its own way.",
    translatedQuote: "행복한 가정은 모두 엇비슷하고, 불행한 가정은 불행한 이유가 제각기 다르다.",
    context: "가족과 결혼, 그리고 인간의 행복과 불행에 대한 톨스토이의 통찰이 담긴 서두입니다.",
    rarity: "UR"
  }
];

export default function Encounter() {
  const [packState, setPackState] = useState<'unopened' | 'opening' | 'opened' | 'empty'>('unopened');

  // Card interaction states
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [savedCards, setSavedCards] = useState<number[]>([]);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showingCommentary, setShowingCommentary] = useState(false);

  // Transition to empty state when all cards are saved
  useEffect(() => {
    if (packState === 'opened' && savedCards.length === mockCards.length) {
      const timer = setTimeout(() => {
        setPackState('empty');
        setSavedCards([]);
        setRevealedCards([]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [savedCards, packState]);

  const handleOpenPack = () => {
    setPackState('opened'); // Skip the opening animation as requested
  };

  const handleCardClick = (id: number) => {
    if (focusedCard === null) {
      // Bring to center
      setFocusedCard(id);
      setShowingCommentary(false);

      if (!revealedCards.includes(id)) {
        // Dramatic pause then reveal
        setIsFlipping(true);
        setTimeout(() => {
          setRevealedCards(prev => [...prev, id]);
          setIsFlipping(false);
        }, 800); // 0.8s pause before flip for elegance
      }
    } else if (focusedCard === id) {
      // Already focused.
      if (revealedCards.includes(id) && !isFlipping) {
        if (showingCommentary) {
          // If already showing commentary, next click saves to library
          handleSaveCard(id);
        } else {
          // Toggle to commentary
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
            onClick={handleOpenPack}
          >
            {/* Header Title for Symmetry */}
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">New Arrival</span>
              <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Encounter</h2>
              <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
            </div>

            {/* Luxury Box / Envelope Design */}
            <div className="relative w-64 h-80 rounded-sm shadow-[0_20px_50px_rgba(26,17,10,0.2)] overflow-hidden bg-brand-orange group flex flex-col items-center justify-center border border-brand-brown/5">
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

            <div className="mt-12">
              <span className="text-brand-brown/40 text-[10px] tracking-[0.3em] uppercase">Tap to Unseal</span>
            </div>
          </motion.div>
        )}

        {packState === 'opened' && (
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

            {/* Overlay for focused card - FIXED to prevent clipping */}
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
                      card={mockCards.find(c => c.id === focusedCard)!}
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
              {mockCards.map((card, index) => {
                // Hide card if it's saved
                if (savedCards.includes(card.id)) return null;

                const isFocused = focusedCard === card.id;
                const isRevealed = revealedCards.includes(card.id);

                // Fan Math
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
                      opacity: isFocused ? 0 : 1 // Hide in fan when focused (it's in the overlay)
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
            <h3 className="font-serif text-lg tracking-[0.2em] uppercase mb-4 text-brand-brown">No Collections Available</h3>
            <div className="w-8 h-[1px] bg-brand-brown/20 mb-6"></div>
            <p className="text-[11px] text-brand-brown/60 mb-12 max-w-[240px] leading-relaxed tracking-wide">
              Visit the Boutique to acquire new editions, or explore the Exchange for rare finds.
            </p>

            <div className="w-full max-w-sm mt-4 flex flex-col items-center">
              <h4 className="font-sans text-[9px] tracking-[0.3em] uppercase mb-6 text-brand-brown/50">Recent Discoveries</h4>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x w-full px-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="min-w-[130px] h-[180px] bg-brand-cream rounded-sm relative snap-center shrink-0 overflow-hidden border border-brand-brown/10 flex flex-col items-center justify-center p-4 shadow-sm">
                    <div className="absolute inset-0 card-texture opacity-40"></div>
                    <div className="absolute inset-1 border border-brand-gold/20"></div>
                    <span className="text-brand-brown text-[10px] font-serif italic relative z-10 mb-4">User_{Math.floor(Math.random() * 1000)}</span>
                    <div className="px-3 py-1 border-[0.5px] border-brand-brown/30 text-[8px] text-brand-brown uppercase tracking-[0.2em] relative z-10">
                      View
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
