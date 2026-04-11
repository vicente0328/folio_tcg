import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Search, ChevronRight } from 'lucide-react';
import Card from './Card';
import { toUICard } from '../lib/cardAdapter';
import { getAllUsers, getCardPool, type PoolCard } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import { type UserProfile } from '../context/AuthContext';
import { type CardData } from '../data/cards';

interface SearchOverlayProps {
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
}

type Tab = 'collectors' | 'cards';

const GRADE_DOT: Record<string, string> = {
  Legendary: 'bg-brand-gold',
  Epic: 'bg-purple-400',
  Rare: 'bg-gray-400',
  Common: 'bg-brand-brown/30',
};

export default function SearchOverlay({ onClose, onSelectUser }: SearchOverlayProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('collectors');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cards, setCards] = useState<PoolCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);

  // Fetch data on mount
  useEffect(() => {
    Promise.all([getAllUsers(), getCardPool()]).then(([u, c]) => {
      setUsers(u);
      setCards(c);
      setLoading(false);
    });
  }, []);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredUsers = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return users
      .filter(u => u.uid !== user?.uid && u.displayName.toLowerCase().includes(q))
      .slice(0, 20);
  }, [users, debouncedQuery, user?.uid]);

  const filteredCards = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return cards
      .filter(c =>
        c.book?.toLowerCase().includes(q) ||
        c.author?.toLowerCase().includes(q) ||
        c.original?.toLowerCase().includes(q) ||
        c.translation?.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [cards, debouncedQuery]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed inset-0 z-[130] bg-brand-cream flex flex-col max-w-md mx-auto"
      style={{ height: '100dvh' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-3 border-b border-brand-brown/10 flex-shrink-0">
        <button onClick={onClose} className="text-brand-brown/40 hover:text-brand-brown transition-colors shrink-0">
          <X size={20} strokeWidth={1.5} />
        </button>
        <div className="relative flex-1">
          <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/30" />
          <input
            autoFocus
            type="text"
            placeholder="Search collectors or cards..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border border-brand-brown/15 rounded-sm pl-9 pr-4 py-2.5 text-[11px] text-brand-brown placeholder:text-brand-brown/25 focus:outline-none focus:border-brand-brown/40 tracking-wide transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-8 py-3 border-b border-brand-brown/5">
        {(['collectors', 'cards'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[10px] uppercase tracking-[0.2em] pb-1 transition-colors ${tab === t ? 'text-brand-brown border-b border-brand-brown font-medium' : 'text-brand-brown/40 hover:text-brand-brown'}`}
          >
            {t === 'collectors' ? 'Collectors' : 'Cards'}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 rounded-full border border-brand-brown/20 flex items-center justify-center animate-pulse">
              <span className="font-serif text-brand-brown/40 text-sm">F</span>
            </div>
          </div>
        ) : !debouncedQuery.trim() ? (
          <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-16">
            Find collectors or discover cards
          </p>
        ) : tab === 'collectors' ? (
          /* Collectors Results */
          filteredUsers.length === 0 ? (
            <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-12">No collectors found</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredUsers.map((u, i) => (
                <motion.button
                  key={u.uid}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onSelectUser(u)}
                  className="flex items-center justify-between w-full border border-brand-brown/10 rounded-lg px-5 py-4 bg-brand-cream hover:border-brand-brown/25 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-serif text-brand-brown text-sm">{u.displayName[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-serif text-brand-brown text-[12px] tracking-wide">{u.displayName}</p>
                      <p className="text-brand-brown/35 text-[9px] tracking-widest uppercase mt-0.5">Collector</p>
                    </div>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-brand-brown/20 group-hover:text-brand-brown/40 transition-colors" />
                </motion.button>
              ))}
            </div>
          )
        ) : (
          /* Cards Results */
          filteredCards.length === 0 ? (
            <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-12">No cards found</p>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredCards.map((card, i) => (
                <motion.button
                  key={card.card_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setPreviewCard(card)}
                  className="w-full text-left border border-brand-brown/8 rounded-lg px-4 py-3 hover:border-brand-brown/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${GRADE_DOT[card.grade] || GRADE_DOT.Common}`} />
                    <span className="font-serif text-brand-brown text-[11px] tracking-wide truncate">
                      {card.book}
                    </span>
                    <span className="text-brand-brown/40 text-[10px]">—</span>
                    <span className="text-brand-brown/50 text-[10px] font-sans truncate">{card.author}</span>
                  </div>
                  <p className="text-brand-brown/40 text-[10px] italic truncate pl-[18px]">
                    {(card.translation || card.original || '').slice(0, 60)}
                    {(card.translation || card.original || '').length > 60 ? '...' : ''}
                  </p>
                </motion.button>
              ))}
            </div>
          )
        )}
      </div>

      {/* Card Preview Overlay */}
      {previewCard && (() => {
        const uiCard = toUICard(previewCard, 0);
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-brand-cream/[0.98] z-10 flex flex-col items-center justify-center"
            onClick={() => setPreviewCard(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <Card card={uiCard} isRevealed={true} />
            </motion.div>
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => setPreviewCard(null)}
              className="mt-8 px-5 py-2 border border-brand-brown/20 rounded-sm text-[10px] tracking-[0.15em] uppercase text-brand-brown/60 hover:text-brand-brown hover:border-brand-brown/40 transition-colors"
            >
              Back to results
            </motion.button>
          </motion.div>
        );
      })()}
    </motion.div>,
    document.body
  );
}
