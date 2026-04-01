import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowUpDown, Grid3X3, BookOpen, List, X } from 'lucide-react';
import FolioCard from '../components/FolioCard';
import { CARDS, BOOK_AUTHORS } from '../data/cards';
import { cn } from '../lib/utils';

type FilterType = 'All' | 'Legendary' | 'Epic' | 'Rare' | 'Common';
type SortType = 'newest' | 'rarity' | 'book';
type ViewMode = 'grid' | 'book' | 'list';

const EASE = [0.25, 0.1, 0.25, 1] as const;

const FILTERS: { key: FilterType; label: string; color: string }[] = [
  { key: 'All', label: '전체', color: '#c4b89a' },
  { key: 'Legendary', label: 'L', color: '#c4a24d' },
  { key: 'Epic', label: 'E', color: '#c76d8a' },
  { key: 'Rare', label: 'R', color: '#6ba3a3' },
  { key: 'Common', label: 'C', color: '#7a6f5d' },
];

const BOOKS = Object.keys(BOOK_AUTHORS);
const GRADE_ORDER: Record<string, number> = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };

export default function Library() {
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortType>('rarity');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCard, setSelectedCard] = useState<any>(null);

  // Mock: first 16 cards as "owned"
  const collection = useMemo(() =>
    CARDS.slice(0, 16).map((card, i) => ({
      ...card,
      acquiredAt: new Date(Date.now() - i * 86400000).toISOString(),
    })), []
  );

  const filtered = useMemo(() => {
    let result = [...collection];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.original.toLowerCase().includes(q) ||
        c.translation.toLowerCase().includes(q) ||
        c.book.toLowerCase().includes(q) ||
        c.author?.toLowerCase().includes(q)
      );
    }
    if (filter !== 'All') result = result.filter(c => c.grade === filter);
    result.sort((a, b) => {
      if (sort === 'rarity') return (GRADE_ORDER[b.grade] || 0) - (GRADE_ORDER[a.grade] || 0);
      if (sort === 'book') return a.book.localeCompare(b.book);
      return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
    });
    return result;
  }, [collection, filter, sort, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: collection.length };
    collection.forEach(card => { c[card.grade] = (c[card.grade] || 0) + 1; });
    return c;
  }, [collection]);

  // Per-book counts for progress
  const bookCounts = useMemo(() => {
    const owned: Record<string, number> = {};
    const total: Record<string, number> = {};
    collection.forEach(c => { owned[c.book] = (owned[c.book] || 0) + 1; });
    CARDS.forEach(c => { total[c.book] = (total[c.book] || 0) + 1; });
    return { owned, total };
  }, [collection]);

  // Completion title
  const completionPct = (collection.length / CARDS.length) * 100;
  const collectorTitle = completionPct >= 75 ? '대문헌관' : completionPct >= 50 ? '학자' : completionPct >= 25 ? '애서가' : '초보 수집가';

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-4">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="flex items-end justify-between mb-1">
          <h2 className="font-serif text-[1.5rem] font-light tracking-[0.15em] text-folio-text">나의 서재</h2>
          <span className="font-serif text-[11px] text-folio-text-muted/40">
            <span className="text-folio-gold">{collection.length}</span> / {CARDS.length}장
          </span>
        </div>
        <p className="font-serif text-[9px] text-folio-text-muted/30 tracking-[0.15em] mb-4">{collectorTitle}</p>
      </motion.div>

      {/* ── Collection Progress ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
        className="mb-5 p-3.5 border border-folio-border/40 rounded-[3px] bg-folio-surface/15"
      >
        {/* Overall bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-serif text-[9px] text-folio-text-muted/35 tracking-[0.2em] uppercase">수집 현황</span>
          <span className="font-serif text-[9px] text-folio-text-muted/25">{completionPct.toFixed(0)}%</span>
        </div>
        <div className="h-[4px] bg-folio-border/30 rounded-full overflow-hidden flex mb-3">
          {(['Legendary', 'Epic', 'Rare', 'Common'] as const).map(grade => {
            const pct = ((counts[grade] || 0) / CARDS.length) * 100;
            return pct > 0 ? (
              <div key={grade} className={`rarity-bar-${grade.toLowerCase()} h-full`} style={{ width: `${pct}%`, opacity: 0.7 }} />
            ) : null;
          })}
        </div>

        {/* Per-book progress rings */}
        <div className="flex justify-between">
          {BOOKS.map(book => {
            const owned = bookCounts.owned[book] || 0;
            const total = bookCounts.total[book] || 1;
            const pct = (owned / total) * 100;
            return (
              <div key={book} className="flex flex-col items-center gap-1">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(40,33,26,0.5)" strokeWidth="2" />
                    <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(196,162,77,0.4)" strokeWidth="2"
                      strokeDasharray={`${(pct / 100) * 81.7} 81.7`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-serif text-[7px] text-folio-text-muted/40">{owned}</span>
                </div>
                <span className="font-serif text-[6px] text-folio-text-muted/25 tracking-wider truncate max-w-[3rem] text-center">{book}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Search ── */}
      <div className="relative mb-3 group">
        <Search size={14} strokeWidth={1.3} className="absolute left-3 top-1/2 -translate-y-1/2 text-folio-text-muted/30 group-focus-within:text-folio-gold/50 transition-colors" />
        <input
          type="text"
          placeholder="문장, 작품, 저자..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-folio-surface/25 border border-folio-border-light/30 rounded-[2px] py-2 pl-8 pr-3 text-[12px] font-sans text-folio-text placeholder:text-folio-text-muted/25 focus:outline-none focus:border-folio-gold/25 transition-all duration-400"
        />
      </div>

      {/* ── View Mode + Filters + Sort ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          {FILTERS.map(f => {
            const active = filter === f.key;
            const count = counts[f.key] || 0;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-2 py-1 rounded-[2px] text-[9px] font-serif tracking-[0.15em] uppercase border transition-all duration-400",
                  active
                    ? "border-current/25 bg-current/8"
                    : "border-transparent text-folio-text-muted/25 hover:text-folio-text-muted/40"
                )}
                style={active ? { color: f.color } : undefined}
              >
                {f.label}
                {active && count > 0 && <span className="ml-1 opacity-40">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggles */}
          <div className="flex items-center gap-0.5 border border-folio-border/40 rounded-[2px] p-0.5">
            {([
              { mode: 'grid' as const, icon: Grid3X3 },
              { mode: 'book' as const, icon: BookOpen },
              { mode: 'list' as const, icon: List },
            ]).map(v => (
              <button
                key={v.mode}
                onClick={() => setViewMode(v.mode)}
                className={cn(
                  "p-1 rounded-[1px] transition-colors",
                  viewMode === v.mode ? "bg-folio-gold/15 text-folio-gold/60" : "text-folio-text-muted/25 hover:text-folio-text-muted/40"
                )}
              >
                <v.icon size={11} strokeWidth={1.2} />
              </button>
            ))}
          </div>

          <button
            onClick={() => setSort(s => s === 'rarity' ? 'newest' : s === 'newest' ? 'book' : 'rarity')}
            className="flex items-center gap-1 text-[9px] font-serif text-folio-text-muted/30 hover:text-folio-text-muted/50 transition-colors tracking-wider"
          >
            {sort === 'rarity' ? '등급' : sort === 'newest' ? '최신' : '작품'}
            <ArrowUpDown size={10} strokeWidth={1.2} />
          </button>
        </div>
      </div>

      {/* ── Grid View ── */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
          <p className="font-serif text-sm text-folio-text-muted italic">
            {search ? '검색 결과가 없습니다' : '아직 문장이 없습니다'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div layout className="grid grid-cols-2 gap-2.5">
          <AnimatePresence>
            {filtered.map((card, i) => (
              <motion.div
                key={card.card_id + i}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <FolioCard card={card} compact onClick={() => setSelectedCard(card)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : viewMode === 'book' ? (
        <div className="space-y-5">
          {BOOKS.map(book => {
            const bookCards = filtered.filter(c => c.book === book);
            if (bookCards.length === 0) return null;
            return (
              <div key={book}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-serif text-[12px] text-folio-text/80 tracking-[0.08em]">{book}</span>
                    <span className="font-serif text-[9px] text-folio-text-muted/30 ml-2">{BOOK_AUTHORS[book]}</span>
                  </div>
                  <span className="font-serif text-[9px] text-folio-gold/40">{bookCards.length} / {bookCounts.total[book] || 0}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {bookCards.map((card, i) => (
                    <div key={card.card_id + i}>
                      <FolioCard card={card} compact onClick={() => setSelectedCard(card)} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="space-y-1">
          {filtered.map((card, i) => {
            const gradeColors: Record<string, string> = { Legendary: '#c4a24d', Epic: '#c76d8a', Rare: '#6ba3a3', Common: '#7a6f5d' };
            return (
              <motion.button
                key={card.card_id + i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02, duration: 0.3, ease: EASE }}
                onClick={() => setSelectedCard(card)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[2px] border border-folio-border/30 bg-folio-surface/10 hover:border-folio-gold/15 transition-all duration-400 text-left"
              >
                <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: gradeColors[card.grade], opacity: 0.6 }} />
                <span className="font-serif text-[9px] text-folio-text-muted/35 w-14 shrink-0 tracking-wider">{card.card_id}</span>
                <p className="font-serif text-[11px] text-folio-text/70 truncate flex-1 italic">{card.original}</p>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── Card Detail Modal ── */}
      <AnimatePresence>
        {selectedCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCard(null)}
              className="fixed inset-0 bg-black/70 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-folio-bg border-t border-folio-border-light/40 rounded-t-xl max-h-[85vh] overflow-y-auto"
            >
              <div className="px-5 pt-5 pb-8">
                {/* Close & handle */}
                <div className="flex justify-center mb-3">
                  <div className="w-8 h-[3px] rounded-full bg-folio-border-light/40" />
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-4 right-4 text-folio-text-muted/30 hover:text-folio-text-muted/60 transition-colors"
                >
                  <X size={18} strokeWidth={1.2} />
                </button>

                {/* Full card */}
                <div className="flex justify-center mb-5">
                  <FolioCard card={selectedCard} />
                </div>

                {/* Metadata */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[9px] text-folio-text-muted/35 tracking-[0.15em] uppercase">카드 ID</span>
                    <span className="font-serif text-[11px] text-folio-text/60 tracking-wider">{selectedCard.card_id}</span>
                  </div>
                  <div className="ornament-line" />
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[9px] text-folio-text-muted/35 tracking-[0.15em] uppercase">작품</span>
                    <span className="font-serif text-[11px] text-folio-text/60">{selectedCard.book}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[9px] text-folio-text-muted/35 tracking-[0.15em] uppercase">장</span>
                    <span className="font-serif text-[11px] text-folio-text/60">{selectedCard.chapter}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[9px] text-folio-text-muted/35 tracking-[0.15em] uppercase">저자</span>
                    <span className="font-serif text-[11px] text-folio-text/60">{selectedCard.author}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
