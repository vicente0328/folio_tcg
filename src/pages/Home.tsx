import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import FolioCard from '../components/FolioCard';
import { Coins, PackageOpen } from 'lucide-react';

export default function Home({ user }: { user: any }) {
  const [points, setPoints] = useState(0);
  const [opening, setOpening] = useState(false);
  const [newCards, setNewCards] = useState<any[]>([]);

  useEffect(() => {
    const fetchPoints = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setPoints(userSnap.data().points);
      }
    };
    fetchPoints();
  }, [user]);

  const handleAttendance = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const lastDate = new Date(data.lastAttendance).toDateString();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastDate === today) {
          alert("오늘은 이미 출석하셨습니다.");
          return;
        }

        // Calculate streak
        const currentStreak = data.attendanceStreak || 0;
        const newStreak = lastDate === yesterday ? currentStreak + 1 : 1;
        const isWeeklyBonus = newStreak % 7 === 0;
        const bonusPoints = 10 + (isWeeklyBonus ? 30 : 0);

        await updateDoc(userRef, {
          points: increment(bonusPoints),
          lastAttendance: new Date().toISOString(),
          attendanceStreak: newStreak
        });
        setPoints(p => p + bonusPoints);

        if (isWeeklyBonus) {
          alert(`출석 완료! 🎉 ${newStreak}일 연속 출석 보너스! +${bonusPoints}pt (기본 10 + 보너스 30)`);
        } else {
          alert(`출석 완료! +10pt (연속 ${newStreak}일째)`);
        }
      }
    } catch (error) {
      console.error("Error with attendance:", error);
    }
  };

  const handleOpenPack = async () => {
    if (points < 100) {
      alert("포인트가 부족합니다.");
      return;
    }
    
    setOpening(true);
    setNewCards([]);

    try {
      // Deduct points
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { points: increment(-100) });
      setPoints(p => p - 100);

      // Fetch available cards from pool
      const cardsRef = collection(db, 'cards');
      const q = query(cardsRef, where("status", "==", "pool"));
      const snapshot = await getDocs(q);

      const pool = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

      // Group pool by grade
      const poolByGrade: Record<string, any[]> = {
        Legendary: pool.filter(c => c.grade === 'Legendary'),
        Epic: pool.filter(c => c.grade === 'Epic'),
        Rare: pool.filter(c => c.grade === 'Rare'),
        Common: pool.filter(c => c.grade === 'Common'),
      };

      // Probability-based selection per card (기획서 3.3: 60/28/10/2%)
      const rollGrade = (): string => {
        const roll = Math.random() * 100;
        if (roll < 2) return 'Legendary';
        if (roll < 12) return 'Epic';
        if (roll < 40) return 'Rare';
        return 'Common';
      };

      const selected: any[] = [];
      const usedIds = new Set<string>();

      for (let i = 0; i < 5; i++) {
        let grade = rollGrade();
        // Fallback: if no cards available in rolled grade, try lower grades
        const fallbackOrder = ['Common', 'Rare', 'Epic', 'Legendary'];
        let candidates = poolByGrade[grade]?.filter(c => !usedIds.has(c.id)) || [];

        if (candidates.length === 0) {
          for (const fb of fallbackOrder) {
            candidates = poolByGrade[fb]?.filter(c => !usedIds.has(c.id)) || [];
            if (candidates.length > 0) { grade = fb; break; }
          }
        }

        if (candidates.length > 0) {
          const idx = Math.floor(Math.random() * candidates.length);
          const card = candidates[idx];
          selected.push(card);
          usedIds.add(card.id);
        }
      }

      // Claim cards
      for (const card of selected) {
        await updateDoc(doc(db, 'cards', card.id), {
          status: 'owned',
          current_owner: user.uid
        });
      }

      setTimeout(() => {
        setNewCards(selected);
        setOpening(false);
      }, 2000);

    } catch (error) {
      console.error("Error opening pack:", error);
      setOpening(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-12">
      <div className="w-full flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-serif text-[#d4af37] mb-2">팩 상점</h1>
          <p className="text-gray-400 italic">새로운 문장을 만나보세요.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleAttendance}
            className="px-4 py-2 border border-[#d4af37]/50 text-[#d4af37] rounded-full hover:bg-[#d4af37]/10 transition-colors font-serif text-sm"
          >
            매일 출석 (+10pt)
          </button>
          <div className="flex items-center gap-3 bg-[#2a2a2a] px-6 py-3 rounded-full border border-[#d4af37]/30">
            <Coins className="text-[#d4af37]" size={24} />
            <span className="text-2xl font-bold text-[#d4af37]">{points}</span>
            <span className="text-sm text-gray-400 ml-1">pt</span>
          </div>
        </div>
      </div>

      {!opening && newCards.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e1e1e] border border-gray-800 rounded-2xl p-12 text-center max-w-md w-full shadow-2xl"
        >
          <div className="w-32 h-40 bg-gradient-to-br from-[#d4af37] to-[#8a6d1c] mx-auto rounded-xl shadow-lg shadow-[#d4af37]/20 mb-8 flex items-center justify-center border-2 border-[#fff]/20">
            <span className="font-serif text-3xl text-white font-bold tracking-widest">FOLIO</span>
          </div>
          <h2 className="text-2xl font-serif text-white mb-4">기본 문학 팩</h2>
          <p className="text-gray-400 mb-8">5장의 무작위 문장 카드가 들어있습니다.</p>
          <button 
            onClick={handleOpenPack}
            className="w-full py-4 bg-[#d4af37] text-[#1a1a1a] font-bold rounded-lg hover:bg-[#e5c158] transition-colors flex items-center justify-center gap-2 text-lg"
          >
            <PackageOpen size={24} /> 100pt로 열기
          </button>
        </motion.div>
      )}

      {opening && (
        <div className="flex flex-col items-center justify-center h-64">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="w-32 h-40 bg-gradient-to-br from-[#d4af37] to-[#8a6d1c] rounded-xl shadow-[0_0_50px_rgba(212,175,55,0.5)]"
          />
          <p className="mt-8 text-xl font-serif text-[#d4af37] animate-pulse">포장을 뜯는 중...</p>
        </div>
      )}

      {newCards.length > 0 && (
        <div className="w-full">
          <h2 className="text-3xl font-serif text-center text-[#d4af37] mb-12">새로운 문장을 획득했습니다!</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <AnimatePresence>
              {newCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.2 }}
                >
                  <FolioCard card={card} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-16 text-center">
            <button 
              onClick={() => setNewCards([])}
              className="px-8 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-white transition-colors rounded-lg font-serif"
            >
              상점으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
