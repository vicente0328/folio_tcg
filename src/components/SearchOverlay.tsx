import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight } from 'lucide-react';
import Card from './Card';
import { toUICard } from '../lib/cardAdapter';
import { getAllUsers, getCardPool, getFollowing, type PoolCard } from '../lib/firestore';
import { useAuth } from '../context/AuthContext';
import { type UserProfile } from '../context/AuthContext';
import { type CardData } from '../data/cards';

interface SearchTabProps {
  onSelectUser: (user: UserProfile) => void;
}

type Tab = 'collectors' | 'cards';

const GRADE_DOT: Record<string, string> = {
  Legendary: 'bg-brand-gold',
  Epic: 'bg-purple-400',
  Rare: 'bg-gray-400',
  Common: 'bg-brand-brown/30',
};

export default function SearchTab({ onSelectUser }: SearchTabProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('collectors');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cards, setCards] = useState<PoolCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Fetch data on mount
  useEffect(() => {
    Promise.all([getAllUsers(), getCardPool()]).then(([u, c]) => {
      setUsers(u);
      setCards(c);
      setLoading(false);
    });
    if (user) {
      getFollowing(user.uid).then(f => setFollowingIds(new Set(f.map(x => x.followedId))));
    }
  }, [user]);

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

  // Shuffle helper
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Recommended users when no query entered
  const recommendedFollowing = useMemo(() => {
    const following = users.filter(u => u.uid !== user?.uid && followingIds.has(u.uid));
    return shuffle(following).slice(0, 5);
  }, [users, user?.uid, followingIds]);

  const recommendedOthers = useMemo(() => {
    const others = users.filter(u => u.uid !== user?.uid && !followingIds.has(u.uid));
    return shuffle(others).slice(0, 5);
  }, [users, user?.uid, followingIds]);

  // Recommended cards when no query entered
  const recommendedCards = useMemo(() => {
    return shuffle(cards).slice(0, 5);
  }, [cards]);

  // Map uid → displayName for owner resolution
  const userMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of users) map.set(u.uid, u);
    return map;
  }, [users]);

  const filteredCards = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    // Also allow searching by owner name
    return cards
      .filter(c =>
        c.book?.toLowerCase().includes(q) ||
        c.author?.toLowerCase().includes(q) ||
        c.original?.toLowerCase().includes(q) ||
        c.translation?.toLowerCase().includes(q) ||
        (c.current_owner && userMap.get(c.current_owner)?.displayName.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [cards, debouncedQuery, userMap]);

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="relative">
          <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/30" />
          <input
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
          tab === 'collectors' ? (
            <div className="pt-4">
              {/* Following recommendations */}
              {recommendedFollowing.length > 0 && (
                <div className="mb-6">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-brand-brown/30 mb-3 px-1">Following</p>
                  <div className="flex flex-col gap-2">
                    {recommendedFollowing.map(u => (
                      <button
                        key={u.uid}
                        onClick={() => onSelectUser(u)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-brand-brown/[0.03] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center flex-shrink-0">
                          <span className="font-serif text-brand-brown text-xs">{u.displayName[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-serif text-brand-brown text-[11px] tracking-wide truncate">{u.displayName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Discover recommendations */}
              {recommendedOthers.length > 0 && (
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-brand-brown/30 mb-3 px-1">Discover</p>
                  <div className="flex flex-col gap-2">
                    {recommendedOthers.map(u => (
                      <button
                        key={u.uid}
                        onClick={() => onSelectUser(u)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-brand-brown/[0.03] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center flex-shrink-0">
                          <span className="font-serif text-brand-brown/60 text-xs">{u.displayName[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-serif text-brand-brown/60 text-[11px] tracking-wide truncate">{u.displayName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recommendedFollowing.length === 0 && recommendedOthers.length === 0 && (
                <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-12">No collectors to recommend</p>
              )}
            </div>
          ) : (
            <div className="pt-4">
              <p className="text-[9px] tracking-[0.2em] uppercase text-brand-brown/30 mb-3 px-1">Discover</p>
              <div className="flex flex-col gap-2">
                {recommendedCards.map((card) => {
                  const ownerProfile = card.current_owner ? userMap.get(card.current_owner) : null;
                  return (
                    <motion.div
                      key={card.card_id}
                      className="w-full text-left border border-brand-brown/8 rounded-lg px-4 py-3 hover:border-brand-brown/20 transition-colors"
                    >
                      <button onClick={() => setPreviewCard(card)} className="w-full text-left">
                        <div className="flex items-center gap-2.5 mb-1">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${GRADE_DOT[card.grade] || GRADE_DOT.Common}`} />
                          <span className="font-serif text-brand-brown text-[11px] tracking-wide truncate">{card.book}</span>
                          <span className="text-brand-brown/40 text-[10px]">—</span>
                          <span className="text-brand-brown/50 text-[10px] font-sans truncate">{card.author}</span>
                        </div>
                        <p className="text-brand-brown/40 text-[10px] italic truncate pl-[18px]">
                          {(card.translation || card.original || '').slice(0, 60)}
                          {(card.translation || card.original || '').length > 60 ? '...' : ''}
                        </p>
                      </button>
                      {ownerProfile && (
                        <button onClick={() => onSelectUser(ownerProfile)} className="flex items-center gap-1.5 mt-2 pl-[18px] group">
                          <div className="w-4 h-4 rounded-full bg-brand-brown/5 flex items-center justify-center">
                            <span className="font-serif text-brand-brown/50 text-[7px]">{ownerProfile.displayName[0]?.toUpperCase()}</span>
                          </div>
                          <span className="text-[9px] text-brand-brown/40 group-hover:text-brand-orange transition-colors tracking-wide">{ownerProfile.displayName}</span>
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )
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
              {filteredCards.map((card, i) => {
                const ownerProfile = card.current_owner ? userMap.get(card.current_owner) : null;
                return (
                  <motion.div
                    key={card.card_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="w-full text-left border border-brand-brown/8 rounded-lg px-4 py-3 hover:border-brand-brown/20 transition-colors"
                  >
                    <button onClick={() => setPreviewCard(card)} className="w-full text-left">
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
                    </button>
                    <div className="flex items-center gap-2 mt-2 pl-[18px]">
                      <span className="text-[7px] text-brand-gold/45 tracking-[0.3em] uppercase font-medium">1 of 1</span>
                      <span className="text-brand-brown/10">·</span>
                      {ownerProfile ? (
                        <button
                          onClick={() => onSelectUser(ownerProfile)}
                          className="flex items-center gap-1.5 group"
                        >
                          <div className="w-4 h-4 rounded-full bg-brand-brown/5 flex items-center justify-center">
                            <span className="font-serif text-brand-brown/50 text-[7px]">{ownerProfile.displayName[0]?.toUpperCase()}</span>
                          </div>
                          <span className="text-[9px] text-brand-brown/40 group-hover:text-brand-orange transition-colors tracking-wide">
                            {ownerProfile.displayName}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-brand-brown/20 tracking-wide italic">Unclaimed</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Card Preview Overlay */}
      {previewCard && (() => {
        const uiCard = toUICard(previewCard, 0);
        const previewOwner = (previewCard as PoolCard).current_owner
          ? userMap.get((previewCard as PoolCard).current_owner!)
          : null;
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

            {/* Uniqueness + Owner info */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 flex flex-col items-center gap-2"
            >
              <span className="font-sans text-brand-gold/50 text-[8px] tracking-[0.35em] uppercase font-medium">1 of 1</span>
              {previewOwner ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewCard(null); onSelectUser(previewOwner); }}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-brown/5 border border-brand-brown/10 flex items-center justify-center">
                    <span className="font-serif text-brand-brown/50 text-[9px]">{previewOwner.displayName[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-[10px] text-brand-brown/50 group-hover:text-brand-orange transition-colors tracking-wide">
                    Owned by {previewOwner.displayName}
                  </span>
                </button>
              ) : (
                <span className="text-[10px] text-brand-brown/25 tracking-wide italic">Unclaimed</span>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => setPreviewCard(null)}
              className="mt-4 px-5 py-2 border border-brand-brown/20 rounded-sm text-[10px] tracking-[0.15em] uppercase text-brand-brown/60 hover:text-brand-brown hover:border-brand-brown/40 transition-colors"
            >
              Back to results
            </motion.button>
          </motion.div>
        );
      })()}
    </div>
  );
}
