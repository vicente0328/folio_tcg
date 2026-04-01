import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import FolioCard from '../components/FolioCard';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

export default function Trade({ user }: { user: any }) {
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [theirCards, setTheirCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(u => u.uid !== user?.uid);
        setOtherUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchUsers();
  }, [user]);

  const handleSelectUser = async (otherUser: any) => {
    setSelectedUser(otherUser);
    setLoading(true);
    try {
      const cardsRef = collection(db, 'cards');
      const q = query(cardsRef, where("current_owner", "==", otherUser.uid));
      const snapshot = await getDocs(q);
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTheirCards(cards);
    } catch (error) {
      console.error("Error fetching their cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeTrade = async (card: any) => {
    alert(`[데모] ${card.book} 카드의 트레이드를 제안했습니다!`);
  };

  if (loading && !selectedUser) {
    return (
      <div className="flex items-center justify-center py-32">
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="font-serif text-sm text-folio-gold/60 tracking-[0.2em]"
        >
          교환소를 여는 중...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-4">
      {/* Header */}
      <div className="section-header">
        <h1 className="font-serif text-2xl text-folio-text font-light tracking-[0.1em]">교환소</h1>
        <p className="font-serif text-xs text-folio-text-muted/60 mt-1 italic">다른 수집가들과 문장을 교환하세요</p>
      </div>

      {!selectedUser ? (
        <div className="mt-2">
          <p className="font-serif text-[10px] text-folio-text-muted/40 tracking-[0.2em] uppercase mb-5">수집가 목록</p>
          <div className="flex flex-col gap-3">
            {otherUsers.map((u, idx) => (
              <motion.button
                key={u.uid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleSelectUser(u)}
                className="w-full flex items-center gap-4 p-4 bg-folio-surface border border-folio-border/60 rounded-sm hover:border-folio-gold/30 transition-all duration-300 group text-left"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-sm bg-folio-elevated border border-folio-border-light/50 flex items-center justify-center shrink-0">
                  <span className="font-serif text-sm text-folio-text-muted/60">
                    {(u.displayName || '?')[0].toUpperCase()}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-folio-text/80 group-hover:text-folio-gold transition-colors truncate">
                    {u.displayName || '익명의 수집가'}
                  </p>
                  <p className="font-serif text-[10px] text-folio-text-muted/40 tracking-wider mt-0.5">
                    {u.points || 0} pt
                  </p>
                </div>
                {/* Arrow */}
                <span className="font-serif text-xs text-folio-text-muted/30 group-hover:text-folio-gold/50 transition-colors">&rsaquo;</span>
              </motion.button>
            ))}
            {otherUsers.length === 0 && (
              <div className="flex flex-col items-center py-20">
                <div className="ornament-divider w-24 mb-4">
                  <span className="text-folio-text-muted/30 font-serif">&#10043;</span>
                </div>
                <p className="font-serif text-sm text-folio-text-muted/40 italic">
                  현재 활동 중인 수집가가 없습니다
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2">
          {/* Back */}
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-1 font-serif text-xs text-folio-text-muted/50 hover:text-folio-gold transition-colors mb-6"
          >
            <ChevronLeft size={14} />
            <span className="tracking-wider">뒤로</span>
          </button>

          {/* Selected User Info */}
          <div className="flex items-center gap-3 p-4 bg-folio-surface border border-folio-border/60 rounded-sm mb-8">
            <div className="w-11 h-11 rounded-sm bg-folio-elevated border border-folio-border-light/50 flex items-center justify-center">
              <span className="font-serif text-base text-folio-gold/70">
                {(selectedUser.displayName || '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-serif text-sm text-folio-text/80">{selectedUser.displayName || '익명의 수집가'}</p>
              <p className="font-serif text-[10px] text-folio-text-muted/40 tracking-wider mt-0.5">
                보유 카드 {theirCards.length}장
              </p>
            </div>
          </div>

          {/* Their Cards */}
          {loading ? (
            <motion.p
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="font-serif text-sm text-folio-gold/60 tracking-[0.2em] text-center py-16"
            >
              카드를 불러오는 중...
            </motion.p>
          ) : theirCards.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <p className="font-serif text-sm text-folio-text-muted/40 italic">이 수집가는 아직 카드가 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {theirCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="relative group"
                >
                  <FolioCard card={card} />
                  {/* Trade overlay */}
                  <div className="absolute inset-0 bg-folio-bg/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm flex items-center justify-center backdrop-blur-sm">
                    <button
                      onClick={() => handleProposeTrade(card)}
                      className="btn-gold text-xs py-2 px-5"
                    >
                      교환 제안
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
