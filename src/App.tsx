import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { seedDatabase } from './lib/seedData';
import Layout from './components/Layout';
import Home from './pages/Home';
import Library from './pages/Library';
import Trade from './pages/Trade';
import Profile from './pages/Profile';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribePoints: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribePoints) {
        unsubscribePoints();
        unsubscribePoints = null;
      }

      if (currentUser) {
        seedDatabase();
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const userData: any = {
            uid: currentUser.uid,
            points: 100,
            wishlist: [],
            collection_stats: {},
            lastAttendance: new Date().toISOString(),
            attendanceStreak: 1
          };
          if (currentUser.displayName) {
            userData.displayName = currentUser.displayName;
          }
          if (currentUser.email) {
            userData.email = currentUser.email;
          }
          await setDoc(userRef, userData);
        }

        unsubscribePoints = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setPoints(snap.data().points || 0);
          }
        });

        setUser(currentUser);
      } else {
        setUser(null);
        setPoints(0);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribePoints) unsubscribePoints();
    };
  }, []);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error('Redirect result error:', error);
    });
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-folio-bg">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-center"
        >
          <p className="font-serif text-3xl text-folio-gold tracking-[0.3em]">FOLIO</p>
          <div className="mt-4 w-16 h-[1px] mx-auto bg-gradient-to-r from-transparent via-folio-gold/40 to-transparent" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-folio-bg px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="decorative-frame text-center max-w-sm w-full"
        >
          {/* Wordmark */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-serif text-5xl md:text-6xl text-folio-gold tracking-[0.4em] font-light mb-2"
          >
            FOLIO
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="font-serif text-[11px] text-folio-text-muted tracking-[0.5em] uppercase mb-10"
          >
            Classical Literature Collection
          </motion.p>

          {/* Ornamental Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="ornament-divider mb-10"
          >
            <span className="text-folio-gold/40 font-serif">&#10044;</span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="font-serif text-lg md:text-xl text-folio-text/80 italic leading-relaxed mb-12"
          >
            "위대한 문장을 소유하는<br/>가장 아름다운 방법"
          </motion.p>

          {/* Login Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            onClick={handleLogin}
            className="btn-gold w-full"
          >
            Google 로그인으로 시작하기
          </motion.button>

          {/* Subtle footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-8 text-[10px] text-folio-text-muted/50 tracking-[0.3em] uppercase font-serif"
          >
            Est. MMXXVI
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout points={points} />}>
          <Route index element={<Home user={user} />} />
          <Route path="library" element={<Library user={user} />} />
          <Route path="trade" element={<Trade user={user} />} />
          <Route path="profile" element={<Profile user={user} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
