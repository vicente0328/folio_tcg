import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { type InventoryCard } from '../../lib/firestore';
import { type UserProfile } from '../../context/AuthContext';

export interface DiscoverCard extends InventoryCard {
  ownerUid: string;
  ownerName: string;
}

interface DiscoverProps {
  allCards: DiscoverCard[];
  loading: boolean;
  onSelectCard: (card: InventoryCard, collector: UserProfile) => void;
  collectors: UserProfile[];
}

const GRADE_COLORS: Record<string, string> = {
  Legendary: 'text-brand-gold',
  Epic: 'text-purple-500',
  Rare: 'text-gray-400',
  Common: 'text-brand-brown/50',
};

export default function Discover({ allCards, loading, onSelectCard, collectors }: DiscoverProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Random 10 for discover (stable until remount)
  const discoverCards = useMemo(() => {
    if (allCards.length <= 10) return allCards;
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  }, [allCards]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allCards.filter(card =>
      card.book?.toLowerCase().includes(q) ||
      card.author?.toLowerCase().includes(q) ||
      card.original?.toLowerCase().includes(q) ||
      card.translation?.toLowerCase().includes(q) ||
      card.chapter?.toLowerCase().includes(q) ||
      card.grade?.toLowerCase().includes(q) ||
      card.card_id?.toLowerCase().includes(q) ||
      card.ownerName?.toLowerCase().includes(q)
    );
  }, [allCards, searchQuery]);

  const displayCards = searchResults ?? discoverCards;
  const isSearching = searchQuery.trim().length > 0;

  const findCollector = (uid: string) => collectors.find(c => c.uid === uid);

  if (loading) {
    return (
      <div className="flex justify-center pt-16">
        <div className="w-8 h-8 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center animate-pulse">
          <span className="font-serif text-brand-brown/40 text-sm">F</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Search */}
      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/30" />
        <input
          type="text"
          placeholder="Search cards by title, author, quote..."
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

      {/* Section label */}
      <div className="text-center">
        <span className="text-[8px] tracking-[0.3em] uppercase text-brand-brown/40">
          {isSearching
            ? `${displayCards.length} result${displayCards.length !== 1 ? 's' : ''}`
            : 'Random Picks'}
        </span>
      </div>

      {/* Cards grid */}
      {displayCards.length === 0 ? (
        <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-8">
          {isSearching ? 'No cards match your search' : 'No cards available'}
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={searchQuery || '__discover__'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 gap-4"
          >
            {displayCards.map((card, i) => {
              const uiCard = toUICard(card, undefined);
              const collector = findCollector(card.ownerUid);
              return (
                <motion.div
                  key={`${card.docId}-${i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-col cursor-pointer group"
                  onClick={() => {
                    if (collector) onSelectCard(card, collector);
                  }}
                >
                  <div className="w-full h-[240px] relative overflow-hidden rounded-lg">
                    <div
                      className="absolute top-0 left-0 origin-top-left"
                      style={{ transform: 'scale(0.6)' }}
                    >
                      <Card card={uiCard} isRevealed={true} compact />
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[9px] text-brand-brown/50 font-serif italic truncate">{card.ownerName}</p>
                      <span className="text-brand-brown/10">·</span>
                      <span className="text-[7px] text-brand-gold/45 tracking-[0.2em] uppercase font-medium flex-shrink-0">1 of 1</span>
                    </div>
                    <span className={`text-[8px] font-medium tracking-widest uppercase ${GRADE_COLORS[card.grade] || ''}`}>
                      {card.grade}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
