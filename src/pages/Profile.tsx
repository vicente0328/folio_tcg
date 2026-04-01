import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import FolioCard from '../components/FolioCard';

export default function Profile({ user }: { user: any }) {
  const [userData, setUserData] = useState<any>(null);
  const [cardCount, setCardCount] = useState(0);
  const [gradeStats, setGradeStats] = useState({ Legendary: 0, Epic: 0, Rare: 0, Common: 0 });
  const [favoriteCard, setFavoriteCard] = useState<any>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }

        const cardsRef = collection(db, 'cards');
        const q = query(cardsRef, where("current_owner", "==", user.uid));
        const snapshot = await getDocs(q);
        setCardCount(snapshot.docs.length);

        // Count by grade
        const stats = { Legendary: 0, Epic: 0, Rare: 0, Common: 0 };
        snapshot.docs.forEach(d => {
          const grade = d.data().grade as keyof typeof stats;
          if (stats[grade] !== undefined) stats[grade]++;
        });
        setGradeStats(stats);

        // Pick highest rarity card as favorite
        const gradeOrder = ['Legendary', 'Epic', 'Rare', 'Common'];
        const sorted = snapshot.docs.sort((a, b) =>
          gradeOrder.indexOf(a.data().grade) - gradeOrder.indexOf(b.data().grade)
        );
        if (sorted.length > 0) {
          setFavoriteCard({ id: sorted[0].id, ...sorted[0].data() });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="pt-8 pb-4 flex flex-col gap-8 min-h-[calc(100vh-8rem)]">

      {/* Profile Header */}
      <div className="section-header flex items-center gap-4">
        <div className="w-12 h-12 rounded-sm bg-folio-surface border border-folio-gold/20 flex items-center justify-center">
          <span className="font-serif text-lg text-folio-gold/70">
            {(user?.displayName || 'U')[0].toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="font-serif text-xl text-folio-text font-light tracking-[0.05em]">
            {user?.displayName || 'Collector'}
          </h2>
          <p className="font-serif text-[10px] text-folio-text-muted/50 tracking-[0.3em] uppercase mt-0.5">
            Folio Collector
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-folio-surface border border-folio-border/60 rounded-sm text-center"
        >
          <span className="block font-serif text-2xl text-folio-gold font-light">{userData?.points || 0}</span>
          <span className="font-serif text-[9px] text-folio-text-muted/40 tracking-[0.3em] uppercase">Points</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 bg-folio-surface border border-folio-border/60 rounded-sm text-center"
        >
          <span className="block font-serif text-2xl text-folio-text font-light">{cardCount}</span>
          <span className="font-serif text-[9px] text-folio-text-muted/40 tracking-[0.3em] uppercase">Cards</span>
        </motion.div>
      </div>

      {/* Grade Breakdown */}
      {cardCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-between px-2"
        >
          {([
            { grade: 'Legendary', color: '#c9a84c' },
            { grade: 'Epic', color: '#c76d8a' },
            { grade: 'Rare', color: '#6ba3a3' },
            { grade: 'Common', color: '#8a7e6b' },
          ] as const).map(({ grade, color }) => (
            <div key={grade} className="text-center">
              <span className="block font-serif text-sm font-light" style={{ color }}>{gradeStats[grade]}</span>
              <span className="font-serif text-[8px] tracking-[0.15em] uppercase" style={{ color, opacity: 0.5 }}>{grade}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Attendance Streak */}
      {userData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="p-4 bg-folio-surface border border-folio-border/60 rounded-sm flex items-center justify-between"
        >
          <div>
            <p className="font-serif text-[10px] text-folio-text-muted/40 tracking-[0.2em] uppercase">연속 출석</p>
            <p className="font-serif text-lg text-folio-text font-light mt-0.5">
              {userData.attendanceStreak || 0}<span className="text-xs text-folio-text-muted/40 ml-1">일</span>
            </p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < (userData.attendanceStreak % 7 || (userData.attendanceStreak > 0 ? 7 : 0))
                    ? 'bg-folio-gold/60'
                    : 'bg-folio-border-light/40'
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Favorite Card */}
      <div>
        <div className="ornament-divider mb-4">
          <span className="text-folio-gold/30 font-serif text-[8px]">&#10043;</span>
        </div>
        <p className="font-serif text-[10px] text-folio-text-muted/40 tracking-[0.25em] uppercase text-center mb-5">
          대표 문장
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          {favoriteCard ? (
            <FolioCard card={favoriteCard} />
          ) : (
            <p className="font-serif text-sm text-folio-text-muted/40 italic py-12">아직 수집한 카드가 없습니다</p>
          )}
        </motion.div>
      </div>

      {/* Sign Out */}
      <div className="mt-auto pt-6">
        <div className="h-[0.5px] bg-gradient-to-r from-transparent via-folio-border/40 to-transparent mb-4" />
        <button
          onClick={handleSignOut}
          className="w-full py-3 flex items-center justify-center gap-2 font-serif text-[11px] text-folio-text-muted/40 tracking-[0.2em] uppercase hover:text-red-400/60 transition-colors duration-300"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
