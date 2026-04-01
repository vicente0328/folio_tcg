import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowUpDown } from 'lucide-react';
import FolioCard from '../components/FolioCard';
import { CARDS } from '../data/cards';
import { cn } from '../lib/utils';

type FilterType = 'All' | 'Legendary' | 'Epic' | 'Rare' | 'Common';
type SortType = 'newest' | 'rarity';

const FILTERS: { key: FilterType; label: string; color: string }[] = [
  { key: 'All', label: '전체', color: '#c4b89a' },
  { key: 'Legendary', label: 'L', color: '#c4a24d' },
  { key: 'Epic', label: 'E', color: '#c76d8a' },
  { key: 'Rare', label: 'R', color: '#6ba3a3' },
  { key: 'Common', label: 'C', color: '#7a6f5d' },
];

export default function Library() {
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortType>('rarity');
  const [search, setSearch] = useState('');

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
    const order: Record<string, number> = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };
    result.sort((a, b) => sort === 'rarity'
      ? (order[b.grade] || 0) - (order[a.grade] || 0)
      : new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
    );
    return result;
  }, [collection, filter, sort, search]);

  // Grade counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: collection.length };
    collection.forEach(card => { c[card.grade] = (c[card.grade] || 0) + 1; });
    return c;
  }, [collection]);

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-4">

      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-2">
        <h2 className="font-serif text-[1.5rem] font-light tracking-[0.15em] text-folio-text">나의 서재</h2>
        <span className="font-serif text-[11px] text-folio-text-muted/40">
          <span className="text-folio-gold">{collection.length}</span> 장
        </span>
      </div>

      {/* ── Collection Progress ── */}
      <div className="mb-5 p-3 border border-folio-border/40 rounded-[3px] bg-folio-surface/15">
        <div className="flex items-center justify-between mb-2">
          <span className="font-serif text-[9px] text-folio-text-muted/35 tracking-[0.2em] uppercase">수집 현황</span>
          <span className="font-serif text-[9px] text-folio-text-muted/25">{collection.length} / {CARDS.length}</span>
        </div>
        {/* Stacked rarity bar */}
        <div className="h-[4px] bg-folio-border/30 rounded-full overflow-hidden flex">
          {(['Legendary', 'Epic', 'Rare', 'Common'] as const).map(grade => {
            const pct = ((counts[grade] || 0) / CARDS.length) * 100;
            return pct > 0 ? (
              <div key={grade} className={`rarity-bar-${grade.toLowerCase()} h-full`} style={{ width: `${pct}%`, opacity: 0.7 }} />
            ) : null;
          })}
        </div>
        {/* Grade counts */}
        <div className="flex justify-between mt-2.5">
          {(['Legendary', 'Epic', 'Rare', 'Common'] as const).map(g => {
            const colors: Record<string, string> = { Legendary: '#c4a24d', Epic: '#c76d8a', Rare: '#6ba3a3', Common: '#7a6f5d' };
            return (
              <div key={g} className="flex items-center gap-1">
                <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: colors[g], opacity: 0.5 }} />
                <span className="font-serif text-[9px]" style={{ color: colors[g], opacity: 0.4 }}>{counts[g] || 0}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4 group">
        <Search size={14} strokeWidth={1.3} className="absolute left-3 top-1/2 -translate-y-1/2 text-folio-text-muted/30 group-focus-within:text-folio-gold/50 transition-colors" />
        <input
          type="text"
          placeholder="문장, 작품, 저자..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-folio-surface/25 border border-folio-border-light/30 rounded-[2px] py-2 pl-8 pr-3 text-[12px] font-sans text-folio-text placeholder:text-folio-text-muted/25 focus:outline-none focus:border-folio-gold/25 transition-all duration-400"
        />
      </div>

      {/* ── Filters + Sort ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1.5">
          {FILTERS.map(f => {
            const active = filter === f.key;
            const count = counts[f.key] || 0;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-2.5 py-1 rounded-[2px] text-[9px] font-serif tracking-[0.15em] uppercase border transition-all duration-400",
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
        <button
          onClick={() => setSort(s => s === 'rarity' ? 'newest' : 'rarity')}
          className="flex items-center gap-1 text-[9px] font-serif text-folio-text-muted/30 hover:text-folio-text-muted/50 transition-colors tracking-wider"
        >
          {sort === 'rarity' ? '등급' : '최신'}
          <ArrowUpDown size={10} strokeWidth={1.2} />
        </button>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
          <p className="font-serif text-sm text-folio-text-muted italic">
            {search ? '검색 결과가 없습니다' : '아직 문장이 없습니다'}
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-2.5">
          <AnimatePresence>
            {filtered.map((card, i) => (
              <motion.div
                key={card.card_id + i}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <FolioCard card={card} compact />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
