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

        // Real-time points listener
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

  // Handle redirect result on page load
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
    return <div className="min-h-screen flex items-center justify-center bg-folio-bg text-folio-gold font-serif text-2xl">Loading Folio...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-folio-bg text-center px-4">
        <h1 className="text-6xl font-serif text-folio-gold mb-4 tracking-widest">FOLIO</h1>
        <p className="text-xl text-folio-text-muted mb-12 font-serif italic">"위대한 문장을 소유하는 가장 아름다운 방법"</p>
        <button 
          onClick={handleLogin}
          className="px-8 py-3 border border-folio-gold text-folio-gold hover:bg-folio-gold hover:text-folio-bg transition-colors duration-300 font-serif text-lg tracking-wider rounded-sm"
        >
          Google 로그인으로 시작하기
        </button>
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
