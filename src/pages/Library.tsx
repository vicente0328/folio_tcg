import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import FolioCard from '../components/FolioCard';
import { motion } from 'motion/react';

const GRADE_ORDER = ['Legendary', 'Epic', 'Rare', 'Common'];
type FilterType = 'all' | 'Legendary' | 'Epic' | 'Rare' | 'Common';

export default function Library({ user }: { user: any }) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const cardsRef = collection(db, 'cards');
        const q = query(cardsRef, where("current_owner", "==", user?.uid));
        const snapshot = await getDocs(q);

        const fetchedCards = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by grade rarity
        fetchedCards.sort((a: any, b: any) =>
          GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade)
        );
        setCards(fetchedCards);
      } catch (error) {
        console.error("Error fetching cards:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchCards();
  }, [user]);

  const filteredCards = filter === 'all' ? cards : cards.filter((c: any) => c.grade === filter);

  const gradeCount = (grade: string) => cards.filter((c: any) => c.grade === grade).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="font-serif text-sm text-folio-gold/60 tracking-[0.2em]"
        >
          서재를 정리하는 중...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-4">
      {/* Header */}
      <div className="section-header flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl text-folio-text font-light tracking-[0.1em]">내 서재</h1>
          <p className="font-serif text-xs text-folio-text-muted/60 mt-1 italic">수집한 문장들을 감상하세요</p>
        </div>
        <p className="font-serif text-sm text-folio-text-muted">
          <span className="text-folio-gold">{cards.length}</span>
          <span className="text-folio-text-muted/50 text-xs ml-1">장</span>
        </p>
      </div>

      {/* Filter Tabs */}
      {cards.length > 0 && (
        <div className="flex gap-1 mb-8 overflow-x-auto">
          {(['all', 'Legendary', 'Epic', 'Rare', 'Common'] as FilterType[]).map((f) => {
            const isActive = filter === f;
            const label = f === 'all' ? '전체' : f;
            const count = f === 'all' ? cards.length : gradeCount(f);
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-serif text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'text-folio-gold border-b border-folio-gold/40'
                    : 'text-folio-text-muted/40 hover:text-folio-text-muted/70'
                }`}
              >
                {label}
                {count > 0 && <span className="ml-1 text-[9px] opacity-50">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="ornament-divider w-32 mb-6">
            <span className="text-folio-text-muted/30 font-serif">&#10043;</span>
          </div>
          <p className="font-serif text-sm text-folio-text-muted/50 italic mb-6">아직 수집한 카드가 없습니다</p>
          <a href="/" className="btn-gold text-xs py-2 px-6 no-underline">
            팩 상점으로 가기
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {filteredCards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.4 }}
            >
              <FolioCard card={card} />
            </motion.div>
          ))}

          {filteredCards.length === 0 && (
            <p className="font-serif text-sm text-folio-text-muted/40 italic py-16">
              해당 등급의 카드가 없습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}
