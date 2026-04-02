import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import Card from './Card';
import { useGame } from '../context/GameContext';
import { toUICard } from '../lib/cardAdapter';
import { CARDS } from '../data/cards';

const TOTAL_CARDS = CARDS.length;

type FilterMode = 'all' | 'author';

export default function Library() {
  const { inventory } = useGame();
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<FilterMode>('all');

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

  const toggleCard = (id: number) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const emptySlots = Math.max(0, 6 - uiCards.length);

  const renderCards = (cards: typeof uiCards) => (
    <>
      {cards.map((card) => (
        <div key={card.id} className="w-[154px] h-[240px] relative cursor-pointer" onClick={() => toggleCard(card.id)}>
          <motion.div
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: 'scale(0.6)' }}
          >
            <Card
              card={card}
              isRevealed={true}
              isFlipped={!!flippedCards[card.id]}
            />
          </motion.div>
        </div>
      ))}
    </>
  );

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
    </div>
  );
}
