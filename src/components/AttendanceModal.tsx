import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { checkAttendance, type AttendanceResult } from '../lib/firestore';

export default function AttendanceModal() {
  const { user } = useAuth();
  const { addPoints } = useGame();
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const res = await checkAttendance(user.uid);
      if (!res.alreadyChecked) {
        setResult(res);
        setVisible(true);
        // Sync points to local state
        addPoints(res.pointsEarned);
      }
    })();
  }, [user]);

  if (!visible || !result) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-brown/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
        onClick={() => setVisible(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-brand-cream border border-brand-brown/10 rounded-sm p-8 max-w-[280px] w-full text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-full border-[0.5px] border-brand-brown/30 flex items-center justify-center mx-auto mb-6">
            <span className="font-serif text-brand-brown text-xl">F</span>
          </div>

          <h3 className="font-serif text-lg tracking-[0.2em] uppercase text-brand-brown mb-2">
            Daily Check-in
          </h3>

          <div className="w-8 h-[1px] bg-brand-brown/20 mx-auto my-4"></div>

          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="font-serif text-brand-orange text-2xl mb-2"
          >
            +{result.pointsEarned} pt
          </motion.p>

          <p className="text-brand-brown/50 text-[10px] tracking-wide mb-6">
            {result.newStreak}일 연속 출석
            {result.newStreak % 7 === 0 && result.newStreak > 0 && (
              <span className="block text-brand-orange mt-1">7일 연속 보너스 +30pt 포함!</span>
            )}
          </p>

          <div className="flex justify-center gap-1 mb-6">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-[8px] ${
                  i < (result.newStreak % 7 || 7)
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                    : 'border-brand-brown/15 text-brand-brown/20'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <button
            onClick={() => setVisible(false)}
            className="bg-brand-brown text-brand-cream px-8 py-2.5 rounded-sm text-[9px] tracking-[0.2em] uppercase font-medium hover:bg-brand-brown/90 transition-colors"
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
