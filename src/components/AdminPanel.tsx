import { useState, useEffect } from 'react';
import { Search, Plus, Wand2, List } from 'lucide-react';
import { type PoolCard, getCardPool } from '../lib/firestore';
import { toUICard } from '../lib/cardAdapter';
import Card from './Card';
import CardEditor from './admin/CardEditor';
import CardGenerator from './admin/CardGenerator';

type View = 'list' | 'editor' | 'generator';
type FilterGrade = 'all' | 'Legendary' | 'Epic' | 'Rare' | 'Common';
type FilterStatus = 'all' | 'pool' | 'owned';

export default function AdminPanel() {
  const [view, setView] = useState<View>('list');
  const [cards, setCards] = useState<PoolCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<PoolCard | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<FilterGrade>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const loadCards = async () => {
    setLoading(true);
    const pool = await getCardPool();
    // Sort: Legendary first, then by card_id
    pool.sort((a, b) => {
      const order: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Common: 3 };
      if (order[a.grade] !== order[b.grade]) return order[a.grade] - order[b.grade];
      return a.card_id.localeCompare(b.card_id);
    });
    setCards(pool);
    setLoading(false);
  };

  useEffect(() => { loadCards(); }, []);

  const filtered = cards.filter(c => {
    if (filterGrade !== 'all' && c.grade !== filterGrade) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (c.card_id || '').toLowerCase().includes(q) ||
        (c.book || '').toLowerCase().includes(q) ||
        (c.author || '').toLowerCase().includes(q) ||
        (c.original || '').toLowerCase().includes(q) ||
        (c.translation || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleEdit = (card: PoolCard) => {
    setEditingCard(card);
    setView('editor');
  };

  const handleNew = () => {
    setEditingCard(null);
    setView('editor');
  };

  const handleSave = () => {
    loadCards();
  };

  const handleBack = () => {
    setView('list');
    setEditingCard(null);
  };

  // Editor or Generator view
  if (view === 'editor') {
    return <CardEditor existingCard={editingCard} onSave={handleSave} onBack={handleBack} />;
  }
  if (view === 'generator') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-brown/10">
          <button onClick={handleBack} className="text-brand-brown/60 hover:text-brand-brown transition-colors">
            <List size={18} strokeWidth={1.5} />
          </button>
          <h2 className="font-serif text-sm tracking-[0.15em] uppercase text-brand-brown">Card Generator</h2>
        </div>
        <CardGenerator />
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col h-full">
      {/* Header actions */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleNew}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-brown text-brand-cream rounded-sm text-[9px] tracking-[0.2em] uppercase font-medium hover:bg-brand-brown/90 transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} />
            New Card
          </button>
          <button
            onClick={() => setView('generator')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-orange text-brand-cream rounded-sm text-[9px] tracking-[0.2em] uppercase font-medium hover:bg-brand-orange/90 transition-colors"
          >
            <Wand2 size={14} strokeWidth={1.5} />
            Generator
          </button>
        </div>

        {/* Search */}
        <div className="relative z-10">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ID, 책 제목, 저자, 원문으로 검색..."
            className="w-full bg-brand-cream border border-brand-brown/15 rounded-sm pl-9 pr-3 py-2.5 text-[11px] text-brand-brown placeholder:text-brand-brown/30 focus:outline-none focus:border-brand-brown/40 focus:ring-1 focus:ring-brand-brown/20 tracking-wide"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-brown/30 hover:text-brand-brown text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {/* Grade filter */}
          <div className="flex gap-1 flex-1">
            {(['all', 'Legendary', 'Epic', 'Rare', 'Common'] as FilterGrade[]).map(g => (
              <button
                key={g}
                onClick={() => setFilterGrade(g)}
                className={`px-2 py-1 text-[8px] tracking-[0.1em] uppercase rounded-sm transition-colors ${
                  filterGrade === g
                    ? 'bg-brand-brown text-brand-cream'
                    : 'bg-brand-brown/5 text-brand-brown/50 hover:bg-brand-brown/10'
                }`}
              >
                {g === 'all' ? 'All' : g.slice(0, 1)}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}
            className="bg-transparent border border-brand-brown/15 rounded-sm px-2 py-1 text-[9px] text-brand-brown/60 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pool">Pool</option>
            <option value="owned">Owned</option>
          </select>
        </div>

        {/* Count */}
        <p className="text-[9px] text-brand-brown/40 tracking-wide">
          {filtered.length} / {cards.length} cards
        </p>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border border-brand-brown/20 flex items-center justify-center animate-pulse">
              <span className="font-serif text-brand-brown/40 text-sm">F</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(card => (
              <button
                key={card.card_id}
                onClick={() => handleEdit(card)}
                className="text-left group"
              >
                <div className="overflow-hidden" style={{ height: 192 }}>
                  <div className="transform scale-[0.48] origin-top-left">
                    <Card card={toUICard(card)} isRevealed={true} compact={true} />
                  </div>
                </div>
                <div className="mt-1 px-0.5">
                  <p className="text-[9px] font-mono text-brand-brown/60 truncate">{card.card_id}</p>
                  <p className="text-[8px] text-brand-brown/30 truncate">{card.book} · {card.chapter}</p>
                  <span className={`inline-block text-[7px] tracking-[0.1em] uppercase mt-0.5 px-1 py-0.5 rounded-sm ${
                    card.status === 'pool'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {card.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
