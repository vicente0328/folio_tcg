import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';
import Card from './Card';
import LikeButton from './LikeButton';
import BookDetail from './BookDetail';
import { useGame } from '../context/GameContext';
import { toUICard } from '../lib/cardAdapter';
import { CARDS } from '../data/cards';

const TOTAL_CARDS = CARDS.length;

type FilterMode = 'all' | 'author' | 'book';

export default function Library() {
  const { inventory } = useGame();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [flippedInFocus, setFlippedInFocus] = useState(false);
  const [showBookDetail, setShowBookDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const uiCards = useMemo(() => {
    const sorted = [...inventory].sort((a, b) => {
      const aTime = (a as any).obtainedAt || '';
      const bTime = (b as any).obtainedAt || '';
      return bTime > aTime ? 1 : bTime < aTime ? -1 : 0;
    });
    return sorted.map((c, i) => toUICard(c, i + 1));
  }, [inventory]);

  // Search filtering
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return uiCards;
    const q = searchQuery.toLowerCase();
    return uiCards.filter(card =>
      card.work?.toLowerCase().includes(q) ||
      card.author?.toLowerCase().includes(q) ||
      card.originalQuote?.toLowerCase().includes(q) ||
      card.translatedQuote?.toLowerCase().includes(q) ||
      card.chapter?.toLowerCase().includes(q) ||
      card.rarity?.toLowerCase().includes(q) ||
      card.cardId?.toLowerCase().includes(q)
    );
  }, [uiCards, searchQuery]);

  // Group by author
  const groupedByAuthor = useMemo(() => {
    if (filter !== 'author') return null;
    const map = new Map<string, typeof filteredCards>();
    for (const card of filteredCards) {
      const list = map.get(card.author) || [];
      list.push(card);
      map.set(card.author, list);
    }
    return map;
  }, [filteredCards, filter]);

  // Group by book
  const groupedByBook = useMemo(() => {
    if (filter !== 'book') return null;
    const map = new Map<string, typeof filteredCards>();
    for (const card of filteredCards) {
      const list = map.get(card.work) || [];
      list.push(card);
      map.set(card.work, list);
    }
    return map;
  }, [filteredCards, filter]);

  const openCard = (id: number) => {
    setFlippedInFocus(false);
    setFocusedId(id);
  };

  const closeCard = () => {
    if (flippedInFocus) setFlippedInFocus(false);
    setFocusedId(null);
  };

  const emptySlots = Math.max(0, 6 - filteredCards.length);

  const renderCards = (cards: typeof uiCards) => (
    <>
      {cards.map((card) => {
        const isFocused = focusedId === card.id;
        return (
          <motion.div
            key={card.id}
            className="w-[154px] h-[240px] relative cursor-pointer overflow-hidden rounded-sm"
            onClick={() => openCard(card.id)}
            animate={{ opacity: isFocused ? 0 : 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{ transform: 'scale(0.6)' }}
            >
              <Card
                card={card}
                isRevealed={true}
                compact
              />
            </div>
          </motion.div>
        );
      })}
    </>
  );

  const renderGrouped = (grouped: Map<string, typeof uiCards>) => (
    <div className="pb-24">
      {[...grouped.entries()].map(([label, cards]) => (
        <div key={label} className="mb-10">
          <h3 className="font-serif text-sm tracking-[0.15em] text-brand-brown/70 mb-4 text-center uppercase">{label}</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 place-items-center">
            {renderCards(cards)}
          </div>
        </div>
      ))}
      {grouped.size === 0 && (
        <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-8">No cards match your search</p>
      )}
    </div>
  );

  const focusedCard = focusedId !== null ? uiCards.find(c => c.id === focusedId) : null;

  return (
    <div className="h-full flex flex-col p-6">
      {/* Symmetrical Header */}
      <div className="flex flex-col items-center mb-8 text-center pt-4">
        <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">Collection</span>
        <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Library</h2>
        <div className="w-8 h-[1px] bg-brand-brown/20 mt-4 mb-4"></div>
        <p className="text-brand-brown/60 text-[10px] tracking-widest uppercase">{uiCards.length} / {TOTAL_CARDS} Masterpieces</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/30" />
        <input
          type="text"
          placeholder="Search your collection..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border border-brand-brown/15 rounded-sm pl-9 pr-9 py-2.5 text-[11px] text-brand-brown placeholder:text-brand-brown/25 focus:outline-none focus:border-brand-brown/40 tracking-wide transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-brown/30 hover:text-brand-brown/60"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Filter Tabs - Centered */}
      <div className="flex justify-center gap-8 mb-8">
        {(['all', 'author', 'book'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`text-[10px] uppercase tracking-[0.2em] pb-1 transition-colors ${filter === tab ? 'text-brand-brown border-b border-brand-brown font-medium' : 'text-brand-brown/40 hover:text-brand-brown'}`}
          >{tab}</button>
        ))}
      </div>

      {/* Card Grid */}
      {filter === 'all' ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 pb-24 place-items-center">
          {renderCards(filteredCards)}
          {!searchQuery && [...Array(emptySlots)].map((_, i) => (
            <div key={`empty-${i}`} className="w-[154px] h-[240px] border border-brand-brown/10 rounded-sm flex flex-col items-center justify-center bg-brand-cream/50 relative">
              <div className="absolute inset-1 border-[0.5px] border-brand-brown/5"></div>
              <div className="w-8 h-[1px] bg-brand-brown/10 mb-3"></div>
              <span className="font-serif text-brand-brown/20 text-lg">L</span>
              <div className="w-8 h-[1px] bg-brand-brown/10 mt-3"></div>
            </div>
          ))}
          {searchQuery && filteredCards.length === 0 && (
            <div className="col-span-2 pt-8">
              <p className="text-center text-brand-brown/30 text-[11px] font-serif italic">No cards match your search</p>
            </div>
          )}
        </div>
      ) : filter === 'author' && groupedByAuthor ? (
        renderGrouped(groupedByAuthor)
      ) : filter === 'book' && groupedByBook ? (
        renderGrouped(groupedByBook)
      ) : null}

      {uiCards.length === 0 && !searchQuery && (
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
            className="fixed inset-0 bg-brand-cream/[0.98] z-[100] flex flex-col items-center justify-center"
            onClick={closeCard}
          >
            {/* Card + close button wrapper — shifted down 15px */}
            <motion.div
              className="relative cursor-pointer mt-[15px]"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 0.8 }}
              onClick={(e) => { e.stopPropagation(); setFlippedInFocus(prev => !prev); }}
            >
              <Card
                card={focusedCard}
                isRevealed={true}
                isFlipped={flippedInFocus}
              />

              {/* Close button — outside card, top-right */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); closeCard(); }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute -top-5 -right-5 z-10 w-8 h-8 rounded-full bg-brand-cream border border-brand-brown/20 flex items-center justify-center text-brand-brown/40 hover:text-brand-brown hover:border-brand-brown/40 transition-colors shadow-sm"
              >
                <X size={15} strokeWidth={1.5} />
              </motion.button>
            </motion.div>

            {/* Controls below card — fixed height to prevent layout shift */}
            <div className="flex flex-col items-center" style={{ minHeight: 100 }}>
              {/* Like button */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="mt-5"
                onClick={(e) => e.stopPropagation()}
              >
                <LikeButton cardId={focusedCard.cardId} />
              </motion.div>

              {/* Tap hint — always visible */}
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="mt-4 font-sans text-brand-brown/40 text-[9px] tracking-[0.2em] uppercase"
              >
                {flippedInFocus ? 'Tap to see front' : 'Tap to read Between the Lines'}
              </motion.span>

              {/* "줄거리 더 알아보기" — fades in/out, below hint */}
              <motion.button
                animate={{ opacity: flippedInFocus ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => { e.stopPropagation(); if (flippedInFocus) setShowBookDetail(true); }}
                className="mt-3 font-serif text-[10px] tracking-[0.15em] text-brand-brown/55 border-b border-brand-brown/20 hover:text-brand-brown hover:border-brand-brown/40 transition-colors pb-0.5"
                style={{ pointerEvents: flippedInFocus ? 'auto' : 'none' }}
              >
                줄거리 더 알아보기
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Book Detail Overlay ═══ */}
      <AnimatePresence>
        {showBookDetail && focusedCard && (
          <BookDetail
            bookTitle={focusedCard.work}
            onClose={() => setShowBookDetail(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
