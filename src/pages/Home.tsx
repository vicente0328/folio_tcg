import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FolioCard from '../components/FolioCard';
import { getRandomCard, type CardData } from '../data/cards';
import { cn } from '../lib/utils';

const CARD_COST = 100;
const EASE = [0.25, 0.1, 0.25, 1] as const;

const RARITY_INFO = [
  { label: 'Common', short: 'C', pct: 60, color: '#7a6f5d' },
  { label: 'Rare', short: 'R', pct: 28, color: '#6ba3a3' },
  { label: 'Epic', short: 'E', pct: 10, color: '#c76d8a' },
  { label: 'Legendary', short: 'L', pct: 2, color: '#c4a24d' },
];

export default function Home({ onBuyCard, points }: { onBuyCard: (cost: number) => void; points: number }) {
  const [drawnCard, setDrawnCard] = useState<CardData | null>(null);
  const [phase, setPhase] = useState<'idle' | 'breaking' | 'reveal'>('idle');

  const handleDraw = () => {
    if (points < CARD_COST || phase !== 'idle') return;
    onBuyCard(CARD_COST);
    setPhase('breaking');
    setTimeout(() => {
      setDrawnCard(getRandomCard());
      setPhase('reveal');
    }, 2000);
  };

  const handleReset = () => {
    setDrawnCard(null);
    setPhase('idle');
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-8rem)] px-5 pt-8 pb-6">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="text-center mb-8 w-full"
      >
        <h1 className="font-serif text-[1.7rem] font-light tracking-[0.18em] text-folio-text leading-tight">
          새로운 문장과의 <em className="not-italic font-normal italic">조우</em>
        </h1>
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="w-8 h-[0.5px] bg-gradient-to-r from-transparent to-folio-gold/25" />
          <span className="text-folio-gold/25 text-[7px]">&#10043;</span>
          <div className="w-8 h-[0.5px] bg-gradient-to-l from-transparent to-folio-gold/25" />
        </div>
      </motion.div>

      {/* ── Card Area ── */}
      <div className="relative w-full max-w-[19rem] aspect-[2/3] flex items-center justify-center mb-8">
        <AnimatePresence mode="wait">
          {/* Idle: Pack */}
          {phase === 'idle' && !drawnCard && (
            <motion.div
              key="pack"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="absolute inset-0"
            >
              <motion.div
                animate={{ boxShadow: ['0 8px 24px rgba(0,0,0,0.3), 0 0 15px rgba(196,162,77,0.05)', '0 8px 24px rgba(0,0,0,0.3), 0 0 35px rgba(196,162,77,0.15)', '0 8px 24px rgba(0,0,0,0.3), 0 0 15px rgba(196,162,77,0.05)'] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="w-full h-full rounded-[4px] border border-folio-border-light/50 bg-folio-surface/50 relative overflow-hidden"
              >
                {/* Crosshatch texture */}
                <div className="absolute inset-0 opacity-[0.025]" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, #c4a24d 6px, #c4a24d 6.3px), repeating-linear-gradient(-45deg, transparent, transparent 6px, #c4a24d 6px, #c4a24d 6.3px)`,
                }} />

                {/* Inner frame */}
                <div className="absolute inset-3 border-[0.5px] border-folio-border-light/25 rounded-[3px]" />

                {/* Wax seal area */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  {/* Seal circle */}
                  <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-full border border-folio-gold/20 bg-gradient-to-br from-folio-elevated to-folio-surface flex items-center justify-center">
                      <span className="font-serif text-2xl text-folio-gold/50 font-light tracking-[0.2em]">F</span>
                    </div>
                    <div className="absolute -inset-2 border-[0.5px] border-dashed border-folio-gold/10 rounded-full animate-[rotateSlowCW_20s_linear_infinite]" />
                  </div>

                  <p className="font-serif text-[13px] text-folio-text-muted/40 italic leading-relaxed text-center px-10 mb-2">
                    "어떤 문장이<br />당신을 기다리고 있을까요"
                  </p>

                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-5 h-[0.5px] bg-folio-border-light/30" />
                    <span className="font-serif text-[9px] text-folio-text-muted/25 tracking-[0.3em] uppercase">Sealed</span>
                    <div className="w-5 h-[0.5px] bg-folio-border-light/30" />
                  </div>
                </div>

                {/* Gradient overlay bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-folio-surface/40 to-transparent" />
              </motion.div>
            </motion.div>
          )}

          {/* Breaking: Seal animation */}
          {phase === 'breaking' && (
            <motion.div
              key="breaking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 8px 24px rgba(0,0,0,0.3), 0 0 0 rgba(196,162,77,0)',
                    '0 8px 24px rgba(0,0,0,0.3), 0 0 50px rgba(196,162,77,0.2)',
                    '0 8px 24px rgba(0,0,0,0.3), 0 0 80px rgba(196,162,77,0.1)',
                  ]
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="w-full h-full rounded-[4px] border border-folio-gold/30 bg-gradient-to-br from-folio-surface via-folio-elevated to-folio-surface flex flex-col items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.8, ease: "linear" }}
                  className="w-14 h-14 border-t-[1.5px] border-l-[0.5px] border-folio-gold/30 rounded-full mb-6"
                />
                <motion.p
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="font-serif text-[12px] text-folio-gold/50 tracking-[0.3em]"
                >
                  봉인 해제 중...
                </motion.p>
              </motion.div>
            </motion.div>
          )}

          {/* Reveal: Card with rarity flash */}
          {phase === 'reveal' && drawnCard && (
            <motion.div
              key="card"
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Rarity-colored flash behind card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5, 2] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-64 h-64 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${
                    drawnCard.grade === 'Legendary' ? 'rgba(196,162,77,0.3)' :
                    drawnCard.grade === 'Epic' ? 'rgba(158,80,112,0.25)' :
                    drawnCard.grade === 'Rare' ? 'rgba(90,144,144,0.2)' :
                    'rgba(122,111,93,0.15)'
                  } 0%, transparent 70%)`
                }}
              />
              {/* Card entrance with flip */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7, rotateY: -90, filter: 'brightness(1.8)' }}
                animate={{ opacity: 1, scale: 1, rotateY: 0, filter: 'brightness(1)' }}
                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
                style={{ perspective: '800px' }}
                className={cn(
                  drawnCard.grade === 'Legendary' ? 'animate-[legendaryFlash_1.2s_ease-out]' :
                  drawnCard.grade === 'Epic' ? 'animate-[epicFlash_1s_ease-out]' :
                  drawnCard.grade === 'Rare' ? 'animate-[rareFlash_0.8s_ease-out]' : ''
                , 'rounded-[4px]')}
              >
                <FolioCard card={drawnCard} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Action Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
        className="w-full max-w-[19rem]"
      >
        {phase === 'idle' && !drawnCard && (
          <button
            onClick={handleDraw}
            disabled={points < CARD_COST}
            className="btn-gold-filled w-full rounded-[3px]"
          >
            <span>문장 뽑기</span>
            <span className="text-[0.8rem] opacity-60 font-light">{CARD_COST} PT</span>
          </button>
        )}

        {phase === 'reveal' && drawnCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col items-center gap-3">
            <button onClick={handleDraw} disabled={points < CARD_COST} className="btn-gold-filled w-full rounded-[3px]">
              <span>한 번 더</span>
              <span className="text-[0.8rem] opacity-60 font-light">{CARD_COST} PT</span>
            </button>
            <button
              onClick={handleReset}
              className="font-serif text-[11px] text-folio-text-muted/40 tracking-[0.2em] hover:text-folio-gold/50 transition-colors duration-500"
            >
              돌아가기
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* ── Rarity Info Panel ── */}
      {phase === 'idle' && !drawnCard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 w-full max-w-[19rem] p-4 border border-folio-border/50 rounded-[3px] bg-folio-surface/20"
        >
          <p className="font-serif text-[9px] text-folio-text-muted/35 tracking-[0.25em] uppercase mb-3">확률 정보</p>
          <div className="space-y-2">
            {RARITY_INFO.map(r => (
              <div key={r.label} className="flex items-center gap-2.5">
                <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: r.color, opacity: 0.6 }} />
                <span className="font-serif text-[10px] w-10 shrink-0 tracking-wider" style={{ color: r.color, opacity: 0.5 }}>{r.short}</span>
                {/* Progress bar */}
                <div className="flex-1 h-[3px] bg-folio-border/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(r.pct, 3)}%`, background: r.color, opacity: 0.5 }}
                  />
                </div>
                <span className="font-serif text-[9px] text-folio-text-muted/30 w-7 text-right">{r.pct}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
