import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import FolioCard from '../components/FolioCard';
import { motion } from 'motion/react';
import { ArrowRightLeft, Search, User } from 'lucide-react';

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

    if (user) {
      fetchUsers();
    }
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
    // In a real app, this would open a modal to select my cards to offer
    // and then create a trade document in Firestore.
  };

  if (loading && !selectedUser) {
    return <div className="text-center py-20 text-[#d4af37] font-serif text-xl animate-pulse">트레이드 시장을 불러오는 중...</div>;
  }

  return (
    <div className="py-12">
      <div className="flex items-center justify-between mb-12 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-serif text-[#d4af37] mb-2 flex items-center gap-3">
            <ArrowRightLeft size={32} /> 트레이드
          </h1>
          <p className="text-gray-400 italic">다른 수집가들과 문장을 교환하세요.</p>
        </div>
      </div>

      {!selectedUser ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-white mb-6">다른 수집가 찾기</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherUsers.map(u => (
              <motion.div
                key={u.uid}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelectUser(u)}
                className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-xl cursor-pointer hover:border-[#d4af37]/50 transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                  <User className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-gray-200">{u.displayName || '익명의 수집가'}</h3>
                  <p className="text-sm text-gray-500">포인트: {u.points}pt</p>
                </div>
              </motion.div>
            ))}
            {otherUsers.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-500 font-serif">
                현재 활동 중인 다른 수집가가 없습니다.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <button 
            onClick={() => setSelectedUser(null)}
            className="mb-8 text-[#d4af37] hover:underline font-serif flex items-center gap-2"
          >
            ← 뒤로 가기
          </button>
          
          <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800 mb-8 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
              <User className="text-gray-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-white">{selectedUser.displayName || '익명의 수집가'}의 서재</h2>
              <p className="text-gray-400">보유 카드: {theirCards.length}장</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-[#d4af37] font-serif text-xl animate-pulse">카드를 불러오는 중...</div>
          ) : theirCards.length === 0 ? (
            <div className="text-center py-32 bg-[#1e1e1e] rounded-2xl border border-gray-800">
              <p className="text-xl text-gray-400 font-serif">이 수집가는 아직 카드가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {theirCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative group"
                >
                  <FolioCard card={card} />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <button 
                      onClick={() => handleProposeTrade(card)}
                      className="px-6 py-2 bg-[#d4af37] text-[#1a1a1a] font-bold rounded-lg hover:bg-[#e5c158] transition-colors font-serif"
                    >
                      트레이드 제안
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
