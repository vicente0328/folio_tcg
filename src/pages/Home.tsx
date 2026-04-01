import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FolioCard from '../components/FolioCard';
import { getRandomCard, type CardData } from '../data/cards';

export default function Home({ onBuyCard, points }: { onBuyCard: (cost: number) => void, points: number }) {
  const [drawnCard, setDrawnCard] = useState<CardData | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const CARD_COST = 100;

  const handleDraw = () => {
    if (points < CARD_COST) {
      alert("포인트가 부족합니다.");
      return;
    }

    setIsDrawing(true);
    onBuyCard(CARD_COST);

    setTimeout(() => {
      const card = getRandomCard();
      setDrawnCard(card);
      setIsDrawing(false);
    }, 1500); // 1.5s animation
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] pt-8 pb-12">
      
      {/* Hero Section */}
      <div className="text-center mb-12 relative w-full">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-64 h-64 text-folio-gold animate-[spin_60s_linear_infinite]">
            <path d="M100 0 A100 100 0 1 1 99.99 0 Z" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 5" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 space-y-4"
        >
          <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-folio-text bg-gradient-to-b from-folio-text to-folio-text-muted bg-clip-text text-transparent">
            새로운 문장과의<br /><span className="italic">조우</span>
          </h1>
          <p className="font-sans text-sm text-folio-text-muted/80 tracking-widest uppercase">
            Discover Hidden Words
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-folio-gold/50" />
            <span className="text-folio-gold/50 text-xs">✦</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-folio-gold/50" />
          </div>
        </motion.div>
      </div>

      {/* Card Display Area */}
      <div className="relative w-full max-w-sm aspect-[2/3] flex items-center justify-center mb-10 perspective-1000">
        <AnimatePresence mode="wait">
          {!drawnCard && !isDrawing && (
             <motion.div
              key="deck"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: 90 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 m-auto w-[18rem] h-[27rem] rounded-md border border-folio-border/80 bg-folio-surface/30 backdrop-blur-sm flex flex-col items-center justify-center shadow-2xl"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(42, 35, 24, 0.1) 10px, rgba(42, 35, 24, 0.1) 20px)'
              }}
            >
              <div className="w-24 h-32 border border-folio-border-light/40 rounded-sm flex items-center justify-center opacity-50 mb-6">
                <span className="font-serif text-4xl text-folio-border-light font-thin">?</span>
              </div>
              <p className="font-serif text-folio-text-muted text-lg italic tracking-widest text-center px-8">
                "어떤 문장이<br />당신을 기다리고 있을까요"
              </p>
            </motion.div>
          )}

          {isDrawing && (
            <motion.div
              key="drawing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: [0.8, 1.05, 1],
                rotateY: [0, 180, 360],
                boxShadow: ['0 0 0px rgba(201,168,76,0)', '0 0 50px rgba(201,168,76,0.3)', '0 0 20px rgba(201,168,76,0.1)']
              }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 m-auto w-[18rem] h-[27rem] rounded-md border-2 border-folio-gold/50 bg-gradient-to-br from-folio-surface to-folio-bg flex items-center justify-center"
            >
               <div className="w-16 h-16 border-t-2 border-l-2 border-folio-gold rounded-full animate-spin opacity-80" />
            </motion.div>
          )}

          {drawnCard && !isDrawing && (
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.9, y: 50, rotateX: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="absolute inset-0 m-auto flex items-center justify-center"
            >
              <FolioCard card={drawnCard} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="w-full max-w-xs flex flex-col items-center"
      >
        <button
          onClick={handleDraw}
          disabled={isDrawing || points < CARD_COST}
          className="group relative w-full overflow-hidden rounded-sm bg-transparent border border-folio-gold/40 text-folio-gold py-4 px-8 transition-all duration-300 hover:border-folio-gold hover:shadow-[0_0_20px_rgba(201,168,76,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 w-0 bg-folio-gold/10 transition-all duration-500 ease-out group-hover:w-full" />
          <div className="relative flex items-center justify-center gap-3">
            <span className="font-serif text-lg tracking-[0.2em] font-medium">문장 뽑기</span>
            <span className="font-sans text-sm text-folio-gold/70 bg-folio-gold/10 px-2 py-0.5 rounded-sm border border-folio-gold/20">
              {CARD_COST} PT
            </span>
          </div>
        </button>
        
        {drawnCard && (
           <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setDrawnCard(null)}
            className="mt-6 text-sm font-sans tracking-widest text-folio-text-muted hover:text-folio-text transition-colors border-b border-folio-text-muted/30 pb-1"
          >
            다시 뽑기
          </motion.button>
        )}
      </motion.div>

    </div>
  );
}
