import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import FolioCard from '../components/FolioCard';
import { motion } from 'motion/react';
import { Library as LibIcon } from 'lucide-react';

export default function Library({ user }: { user: any }) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        setCards(fetchedCards);
      } catch (error) {
        console.error("Error fetching cards:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCards();
    }
  }, [user]);

  if (loading) {
    return <div className="text-center py-20 text-[#d4af37] font-serif text-xl animate-pulse">서재를 정리하는 중...</div>;
  }

  return (
    <div className="py-12">
      <div className="flex items-center justify-between mb-12 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-serif text-[#d4af37] mb-2 flex items-center gap-3">
            <LibIcon size={32} /> 내 서재
          </h1>
          <p className="text-gray-400 italic">수집한 문장들을 감상하세요.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 font-serif">수집한 카드</p>
          <p className="text-3xl font-bold text-[#d4af37] font-serif">{cards.length}<span className="text-lg text-gray-500 ml-1">장</span></p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-32 bg-[#1e1e1e] rounded-2xl border border-gray-800">
          <p className="text-xl text-gray-400 font-serif mb-6">아직 수집한 카드가 없습니다.</p>
          <a href="/" className="px-8 py-3 bg-[#d4af37] text-[#1a1a1a] font-bold rounded-lg hover:bg-[#e5c158] transition-colors font-serif">
            팩 상점으로 가기
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <FolioCard card={card} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
