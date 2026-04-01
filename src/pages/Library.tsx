import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import FolioCard from '../components/FolioCard';
import { CARDS, type CardData } from '../data/cards';
import { cn } from '../lib/utils';

type FilterType = 'All' | 'Legendary' | 'Epic' | 'Rare' | 'Common';
type SortType = 'newest' | 'rarity';

export default function Library() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Mocking user's collection - in a real app, this would come from props/context/DB
  const userCollection = useMemo(() => {
    // Just returning first 12 cards for demo
    return CARDS.slice(0, 12).map((card, index) => ({
      ...card,
      acquiredAt: new Date(Date.now() - index * 86400000).toISOString() // Fake dates
    }));
  }, []);

  const filteredCards = useMemo(() => {
    let result = [...userCollection];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.original.toLowerCase().includes(q) || 
        c.translation.toLowerCase().includes(q) ||
        c.book.toLowerCase().includes(q) ||
        (c.author && c.author.toLowerCase().includes(q))
      );
    }

    // Filter
    if (activeFilter !== 'All') {
      result = result.filter(c => (c.rarity || c.grade) === activeFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
      } else {
        const rarityOrder: Record<string, number> = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };
        const aRank = rarityOrder[(a.rarity || a.grade || 'Common') as string] || 0;
        const bRank = rarityOrder[(b.rarity || b.grade || 'Common') as string] || 0;
        return bRank - aRank;
      }
    });

    return result;
  }, [userCollection, activeFilter, sortBy, searchQuery]);

  const filterOptions: FilterType[] = ['All', 'Legendary', 'Epic', 'Rare', 'Common'];

  return (
    <div className="flex flex-col min-h-full py-6">
      
      {/* Header Area */}
      <div className="px-5 mb-8">
        <h2 className="font-serif text-[1.75rem] font-light tracking-[0.2em] mb-1 text-folio-text">
          나의 서재
        </h2>
        <div className="flex items-center gap-3">
           <div className="h-[1px] w-8 bg-gradient-to-r from-folio-gold/60 to-transparent" />
          <p className="font-sans text-[10px] text-folio-text-muted/80 uppercase tracking-[0.2em]">
            Collection <span className="font-serif text-folio-gold ml-1 text-xs">{userCollection.length}</span>
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 space-y-5 mb-8">
        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-folio-text-muted/60 group-focus-within:text-folio-gold transition-colors">
            <Search size={16} strokeWidth={1.5} />
          </div>
          <input
            type="text"
            placeholder="문장, 책, 저자..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-folio-surface/30 border border-folio-border-light/40 rounded-sm py-2.5 pl-10 pr-4 text-sm font-sans placeholder:text-folio-text-muted/40 text-folio-text focus:outline-none focus:border-folio-gold/40 focus:bg-folio-surface/50 transition-all"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-sm text-[10px] font-serif tracking-[0.2em] border transition-all duration-300 uppercase",
                  activeFilter === filter
                    ? "bg-folio-gold/10 border-folio-gold/40 text-folio-gold shadow-[0_0_15px_rgba(201,168,76,0.15)]"
                    : "bg-transparent border-folio-border-light/30 text-folio-text-muted/60 hover:border-folio-text-muted/40 hover:text-folio-text-muted"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-b border-folio-border-light/30 pb-2">
             <span className="text-[10px] font-sans tracking-[0.2em] text-folio-text-muted/60 uppercase">Sort By</span>
            <button
              onClick={() => setSortBy(prev => prev === 'newest' ? 'rarity' : 'newest')}
              className="flex items-center gap-1.5 text-[10px] font-sans text-folio-text-muted hover:text-folio-gold transition-colors"
            >
               <span className="tracking-[0.2em] uppercase">{sortBy === 'newest' ? '최신순' : '등급순'}</span>
               <ArrowUpDown size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4">
        {filteredCards.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center opacity-40 border border-dashed border-folio-border-light/30 rounded-sm mx-1">
            <span className="font-serif text-4xl mb-6 text-folio-gold/50">🪶</span>
            <p className="font-sans text-xs text-folio-text-muted tracking-[0.2em] leading-relaxed">
              조용히 잠든 책장처럼,<br/>아직 문장이 없습니다.
            </p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-2 gap-4"
          >
            <AnimatePresence>
              {filteredCards.map((card, i) => (
                <motion.div
                  key={card.id || i}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <FolioCard card={card} compact />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

    </div>
  );
}