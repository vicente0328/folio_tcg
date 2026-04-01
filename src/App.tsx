import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'motion/react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Library from './pages/Library';
import Store from './pages/Store';
import Trade from './pages/Trade';

export default function App() {
  const [points, setPoints] = useState(500);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleBuyCard = (cost: number) => {
    setPoints(p => Math.max(0, p - cost));
  };

  const handleEarnPoints = (amount: number) => {
    setPoints(p => p + amount);
  };

  // Login
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-folio-bg px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="decorative-frame text-center max-w-xs w-full"
        >
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
            className="font-serif text-[3.2rem] text-folio-gold tracking-[0.5em] font-light leading-none"
          >
            FOLIO
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="font-serif text-[10px] text-folio-text-muted/60 tracking-[0.6em] uppercase mt-3 mb-12"
          >
            Literary Collection
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
            className="ornament-line-gold mb-10"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="font-serif text-lg text-folio-text/70 italic leading-[1.8] mb-14"
          >
            "위대한 문장을 소유하는<br />가장 아름다운 방법"
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
            onClick={() => setLoggedIn(true)}
            className="btn-gold w-full"
          >
            시작하기
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 2.5 }}
            className="mt-10 font-serif text-[9px] text-folio-text-muted tracking-[0.4em] uppercase"
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
          <Route index element={<Home onBuyCard={handleBuyCard} points={points} />} />
          <Route path="library" element={<Library />} />
          <Route path="store" element={<Store points={points} onEarnPoints={handleEarnPoints} onSpendPoints={handleBuyCard} />} />
          <Route path="trade" element={<Trade />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
