import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import Card from './Card';
import { useGame } from '../context/GameContext';
import { toUICard } from '../lib/cardAdapter';
import { CARDS } from '../data/cards';

const TOTAL_CARDS = CARDS.length;

type FilterMode = 'all' | 'author';

export default function Library() {
  const { inventory } = useGame();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [flippedInFocus, setFlippedInFocus] = useState(false);
  const uiCards = useMemo(() => inventory.map((c, i) => toUICard(c, i + 1)), [inventory]);

  const grouped = useMemo(() => {
    if (filter !== 'author') return null;
    const map = new Map<string, typeof uiCards>();
    for (const card of uiCards) {
      const list = map.get(card.author) || [];
      list.push(card);
      map.set(card.author, list);
    }
    return map;
  }, [uiCards, filter]);

  const openCard = (id: number) => {
    setFlippedInFocus(false);
    setFocusedId(id);
  };

  const closeCard = () => {
    if (flippedInFocus) setFlippedInFocus(false);
    setFocusedId(null);
  };

  const emptySlots = Math.max(0, 6 - uiCards.length);

  const renderCards = (cards: typeof uiCards) => (
    <>
      {cards.map((card) => {
        const isFocused = focusedId === card.id;
        return (
          <div key={card.id} className="w-[154px] h-[240px] relative cursor-pointer overflow-hidden rounded-sm" onClick={() => openCard(card.id)}>
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{ transform: 'scale(0.6)', opacity: isFocused ? 0 : 1, transition: 'opacity 0.2s ease' }}
            >
              <Card
                card={card}
                isRevealed={true}
                compact
              />
            </div>
          </div>
        );
      })}
    </>
  );

  const focusedCard = focusedId !== null ? uiCards.find(c => c.id === focusedId) : null;

  return (
    <div className="h-full flex flex-col p-6">
      {/* Symmetrical Header */}
      <div className="flex flex-col items-center mb-10 text-center pt-4">
        <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">Collection</span>
        <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Library</h2>
        <div className="w-8 h-[1px] bg-brand-brown/20 mt-4 mb-4"></div>
        <p className="text-brand-brown/60 text-[10px] tracking-widest uppercase">{uiCards.length} / {TOTAL_CARDS} Masterpieces</p>
      </div>

      {/* Filter Tabs - Centered */}
      <div className="flex justify-center gap-8 mb-10">
        <button
          onClick={() => setFilter('all')}
          className={`text-[10px] uppercase tracking-[0.2em] pb-1 transition-colors ${filter === 'all' ? 'text-brand-brown border-b border-brand-brown' : 'text-brand-brown/40 hover:text-brand-brown'}`}
        >All</button>
        <button
          onClick={() => setFilter('author')}
          className={`text-[10px] uppercase tracking-[0.2em] pb-1 transition-colors ${filter === 'author' ? 'text-brand-brown border-b border-brand-brown' : 'text-brand-brown/40 hover:text-brand-brown'}`}
        >Author</button>
      </div>

      {/* Card Grid */}
      {filter === 'all' ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 pb-24 place-items-center">
          {renderCards(uiCards)}
          {[...Array(emptySlots)].map((_, i) => (
            <div key={`empty-${i}`} className="w-[154px] h-[240px] border border-brand-brown/10 rounded-sm flex flex-col items-center justify-center bg-brand-cream/50 relative">
              <div className="absolute inset-1 border-[0.5px] border-brand-brown/5"></div>
              <div className="w-8 h-[1px] bg-brand-brown/10 mb-3"></div>
              <span className="font-serif text-brand-brown/20 text-lg">L</span>
              <div className="w-8 h-[1px] bg-brand-brown/10 mt-3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pb-24">
          {grouped && [...grouped.entries()].map(([author, cards]) => (
            <div key={author} className="mb-10">
              <h3 className="font-serif text-sm tracking-[0.15em] text-brand-brown/70 mb-4 text-center uppercase">{author}</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 place-items-center">
                {renderCards(cards)}
              </div>
            </div>
          ))}
        </div>
      )}

      {uiCards.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10">
          <span className="font-serif text-brand-brown/20 text-4xl mb-4">F</span>
          <p className="text-brand-brown/40 text-[11px] tracking-wide leading-relaxed max-w-[200px]">
            Your collection is empty. Visit the Encounter to draw your first cards.
          </p>
        </div>
      )}

      {/* ═══ Focused Card Overlay ═══ */}
      <AnimatePresence>
        {focusedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-brand-cream/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center"
          >
            {/* Close button */}
            <motion.button
              onClick={closeCard}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-14 right-5 z-[110] w-10 h-10 rounded-full border border-brand-brown/15 flex items-center justify-center text-brand-brown/50 hover:text-brand-brown hover:border-brand-brown/30 transition-colors"
            >
              <X size={18} strokeWidth={1.5} />
            </motion.button>

            {/* Card — tap to flip */}
            <motion.div
              className="cursor-pointer"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 0.8 }}
              onClick={() => setFlippedInFocus(prev => !prev)}
            >
              <Card
                card={focusedCard}
                isRevealed={true}
                isFlipped={flippedInFocus}
              />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="mt-8 font-sans text-brand-brown/40 text-[9px] tracking-[0.2em] uppercase"
            >
              {flippedInFocus ? 'Tap to see front' : 'Tap to read Between the Lines'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
