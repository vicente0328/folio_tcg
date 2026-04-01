import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import FolioCard from '../components/FolioCard';

export default function Home({ user }: { user: any }) {
  const [points, setPoints] = useState(0);
  const [opening, setOpening] = useState(false);
  const [newCards, setNewCards] = useState<any[]>([]);
  const [revealIndex, setRevealIndex] = useState(-1);

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
          alert(`출석 완료! +${bonusPoints}pt (${newStreak}일 연속 보너스)`);
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
    setRevealIndex(-1);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { points: increment(-100) });
      setPoints(p => p - 100);

      const cardsRef = collection(db, 'cards');
      const q = query(cardsRef, where("status", "==", "pool"));
      const snapshot = await getDocs(q);

      const pool = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const poolByGrade: Record<string, any[]> = {
        Legendary: pool.filter(c => c.grade === 'Legendary'),
        Epic: pool.filter(c => c.grade === 'Epic'),
        Rare: pool.filter(c => c.grade === 'Rare'),
        Common: pool.filter(c => c.grade === 'Common'),
      };

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

      for (const card of selected) {
        await updateDoc(doc(db, 'cards', card.id), {
          status: 'owned',
          current_owner: user.uid
        });
      }

      setTimeout(() => {
        setNewCards(selected);
        setOpening(false);
        // Sequential reveal
        selected.forEach((_, i) => {
          setTimeout(() => setRevealIndex(i), i * 400);
        });
      }, 2500);

    } catch (error) {
      console.error("Error opening pack:", error);
      setOpening(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-8 pb-4">

      {/* Attendance & Points Bar */}
      <div className="w-full flex items-center justify-between mb-8">
        <button
          onClick={handleAttendance}
          className="font-serif text-xs text-folio-text-muted/70 tracking-[0.15em] hover:text-folio-gold transition-colors duration-300 border-b border-transparent hover:border-folio-gold/30 pb-0.5"
        >
          매일 출석 +10pt
        </button>
        <div className="flex items-center gap-2">
          <span className="font-serif text-[10px] text-folio-text-muted/50 tracking-[0.2em] uppercase">Balance</span>
          <span className="font-serif text-sm text-folio-gold">{points.toLocaleString()}</span>
          <span className="font-serif text-[10px] text-folio-text-muted/50">pt</span>
        </div>
      </div>

      {/* Section Title */}
      <div className="w-full section-header">
        <h1 className="font-serif text-2xl text-folio-text font-light tracking-[0.1em]">팩 상점</h1>
        <p className="font-serif text-xs text-folio-text-muted/60 mt-1 italic">새로운 문장을 만나보세요</p>
      </div>

      {/* Pack Display */}
      {!opening && newCards.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm mt-6"
        >
          {/* Pack Visual */}
          <div className="relative mx-auto w-44 h-56 mb-10 group">
            {/* Back shadow layers */}
            <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-folio-surface/80 rounded-sm border border-folio-border/30" />
            <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 bg-folio-surface rounded-sm border border-folio-border/50" />
            {/* Main pack */}
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(201,168,76,0.08)', '0 0 40px rgba(201,168,76,0.18)', '0 0 20px rgba(201,168,76,0.08)'] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="relative w-full h-full bg-gradient-to-br from-folio-elevated via-folio-surface to-folio-elevated rounded-sm border border-folio-gold/25 flex flex-col items-center justify-center"
            >
              {/* Corner ornaments */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-folio-gold/30" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-folio-gold/30" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-folio-gold/30" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-folio-gold/30" />

              <span className="font-serif text-2xl text-folio-gold/80 tracking-[0.4em] font-light">F</span>
              <div className="w-8 h-[0.5px] bg-folio-gold/20 my-3" />
              <span className="font-serif text-[9px] text-folio-text-muted/40 tracking-[0.4em] uppercase">Folio</span>
            </motion.div>
          </div>

          {/* Pack Info */}
          <div className="text-center mb-8">
            <h2 className="font-serif text-lg text-folio-text font-light tracking-[0.05em] mb-2">기본 문학 팩</h2>
            <p className="font-serif text-xs text-folio-text-muted/60 italic">5장의 무작위 문장 카드가 들어있습니다</p>
          </div>

          {/* Open Button */}
          <button onClick={handleOpenPack} className="btn-gold-filled w-full rounded-sm">
            100pt로 개봉하기
          </button>

          {/* Probability Info */}
          <div className="mt-6 flex justify-center gap-4">
            {[
              { label: 'Common', pct: '60%', color: '#8a7e6b' },
              { label: 'Rare', pct: '28%', color: '#6ba3a3' },
              { label: 'Epic', pct: '10%', color: '#c76d8a' },
              { label: 'Legendary', pct: '2%', color: '#c9a84c' },
            ].map(g => (
              <div key={g.label} className="text-center">
                <div className="w-1.5 h-1.5 rounded-full mx-auto mb-1" style={{ backgroundColor: g.color, opacity: 0.6 }} />
                <span className="font-serif text-[9px] tracking-wider" style={{ color: g.color, opacity: 0.5 }}>{g.pct}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Opening Animation */}
      {opening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 30px rgba(201,168,76,0.2)',
                '0 0 80px rgba(201,168,76,0.5)',
                '0 0 30px rgba(201,168,76,0.2)',
              ]
            }}
            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            className="w-36 h-48 bg-gradient-to-br from-folio-elevated to-folio-surface rounded-sm border border-folio-gold/40 flex items-center justify-center"
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="font-serif text-2xl text-folio-gold/80 tracking-[0.4em]"
            >
              F
            </motion.span>
          </motion.div>
          <div className="mt-10 text-center">
            <motion.p
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="font-serif text-sm text-folio-gold/70 tracking-[0.2em]"
            >
              봉인을 해제하는 중...
            </motion.p>
          </div>
        </motion.div>
      )}

      {/* Card Reveal */}
      {newCards.length > 0 && (
        <div className="w-full mt-4">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-10"
          >
            <div className="ornament-divider mb-4">
              <span className="text-folio-gold/40 font-serif">&#10043;</span>
            </div>
            <h2 className="font-serif text-xl text-folio-text font-light tracking-[0.1em]">새로운 문장을 획득했습니다</h2>
          </motion.div>

          {/* Cards */}
          <div className="flex flex-col items-center gap-6">
            <AnimatePresence>
              {newCards.map((card, idx) => (
                idx <= revealIndex && (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <FolioCard card={card} />
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Back button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: newCards.length * 0.4 + 0.5 }}
            className="mt-12 text-center"
          >
            <button
              onClick={() => { setNewCards([]); setRevealIndex(-1); }}
              className="font-serif text-xs text-folio-text-muted/60 tracking-[0.2em] hover:text-folio-gold transition-colors duration-300 border-b border-folio-border-light/30 hover:border-folio-gold/30 pb-1"
            >
              상점으로 돌아가기
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
