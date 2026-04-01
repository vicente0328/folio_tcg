import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FolioCard from '../components/FolioCard';
import { type CardData } from '../data/cards';
import { drawCard, drawMultiple } from '../lib/gacha';
import { cn } from '../lib/utils';

const EASE = [0.25, 0.1, 0.25, 1] as const;

const DRAW_OPTIONS = [
  { count: 1, cost: 100, label: '봉인 개봉', sub: '1장', guarantee: undefined as CardData['grade'] | undefined },
  { count: 5, cost: 450, label: '연속 개봉', sub: '5장 · Rare↑ 보장', guarantee: 'Rare' as const },
  { count: 10, cost: 850, label: '대량 개봉', sub: '10장 · Epic↑ 보장', guarantee: 'Epic' as const },
];

const RARITY_INFO = [
  { label: 'Legendary', short: 'L', pct: 2, color: '#c4a24d' },
  { label: 'Epic', short: 'E', pct: 10, color: '#c76d8a' },
  { label: 'Rare', short: 'R', pct: 28, color: '#6ba3a3' },
  { label: 'Common', short: 'C', pct: 60, color: '#7a6f5d' },
];

export default function Home({ onBuyCard, points }: { onBuyCard: (cost: number) => void; points: number }) {
  const [drawnCards, setDrawnCards] = useState<CardData[]>([]);
  const [phase, setPhase] = useState<'idle' | 'breaking' | 'reveal' | 'summary'>('idle');
  const [revealIndex, setRevealIndex] = useState(0);
  const [pityCounter, setPityCounter] = useState(0);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [streak, setStreak] = useState(3); // mock
  const [showOdds, setShowOdds] = useState(false);

  const handleDraw = (option: typeof DRAW_OPTIONS[number]) => {
    if (points < option.cost || phase !== 'idle') return;
    onBuyCard(option.cost);
    setPhase('breaking');

    setTimeout(() => {
      if (option.count === 1) {
        const { card, newPity } = drawCard(pityCounter);
        setPityCounter(newPity);
        setDrawnCards([card]);
      } else {
        const { cards, newPity } = drawMultiple(option.count, pityCounter, option.guarantee);
        setPityCounter(newPity);
        setDrawnCards(cards);
      }
      setRevealIndex(0);
      setPhase('reveal');
    }, 2200);
  };

  const handleDailyClaim = () => {
    if (dailyClaimed) return;
    setDailyClaimed(true);
    setPhase('breaking');
    setTimeout(() => {
      const { card, newPity } = drawCard(pityCounter);
      setPityCounter(newPity);
      setDrawnCards([card]);
      setRevealIndex(0);
      setPhase('reveal');
    }, 2200);
  };

  // For multi-draw: advance through cards
  const handleNextCard = () => {
    if (revealIndex < drawnCards.length - 1) {
      setRevealIndex(i => i + 1);
    } else if (drawnCards.length > 1) {
      setPhase('summary');
    } else {
      handleReset();
    }
  };

  const handleReset = () => {
    setDrawnCards([]);
    setRevealIndex(0);
    setPhase('idle');
  };

  const currentCard = drawnCards[revealIndex];

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-8rem)] px-5 pt-6 pb-6">

      {/* ── Daily Encounter ── */}
      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="w-full max-w-[19rem] mb-6"
        >
          <div className="p-4 border border-folio-border-light/40 rounded-[3px] bg-folio-surface/15 relative overflow-hidden">
            {/* Subtle glow */}
            {!dailyClaimed && (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(196,162,77,0.04)_0%,transparent_70%)] pointer-events-none" />
            )}

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-[5px] h-[5px] rounded-full", dailyClaimed ? "bg-folio-text-muted/20" : "bg-folio-gold/60 shadow-[0_0_6px_rgba(196,162,77,0.3)]")} />
                <span className="font-serif text-[10px] text-folio-text-muted/50 tracking-[0.2em] uppercase">오늘의 조우</span>
              </div>
              {dailyClaimed && (
                <span className="font-serif text-[8px] text-folio-text-muted/25 tracking-[0.15em]">수령 완료</span>
              )}
            </div>

            {/* Streak candles */}
            <div className="flex items-center gap-1.5 mb-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className={cn(
                    "w-[3px] h-4 rounded-t-full rounded-b-sm transition-colors",
                    i < streak ? "bg-folio-gold/50" : "bg-folio-border-light/30"
                  )} />
                  {i < streak && (
                    <div className="w-1 h-1 rounded-full bg-folio-gold/40 animate-[breathe_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.2}s` }} />
                  )}
                </div>
              ))}
              <span className="ml-2 font-serif text-[9px] text-folio-gold/40">{streak}일째</span>
            </div>

            <button
              onClick={handleDailyClaim}
              disabled={dailyClaimed}
              className={cn(
                "w-full py-2.5 rounded-[2px] font-serif text-[11px] tracking-[0.15em] transition-all duration-500",
                dailyClaimed
                  ? "bg-folio-surface/20 text-folio-text-muted/20 border border-folio-border/30 cursor-not-allowed"
                  : "bg-folio-gold/10 text-folio-gold/80 border border-folio-gold/25 hover:bg-folio-gold/15 hover:border-folio-gold/40"
              )}
            >
              {dailyClaimed ? '내일 다시 방문하세요' : '무료 문장 받기'}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Card Area ── */}
      <div className="relative w-full max-w-[19rem] aspect-[2/3] flex items-center justify-center mb-6">
        <AnimatePresence mode="wait">
          {/* Idle: Sealed Pack */}
          {phase === 'idle' && (
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

                {/* Seal */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
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

                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-folio-surface/40 to-transparent" />
              </motion.div>
            </motion.div>
          )}

          {/* Breaking animation */}
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

          {/* Reveal single card */}
          {phase === 'reveal' && currentCard && (
            <motion.div
              key={`card-${revealIndex}`}
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={handleNextCard}
            >
              {/* Rarity flash */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5, 2] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-64 h-64 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${
                    currentCard.grade === 'Legendary' ? 'rgba(196,162,77,0.3)' :
                    currentCard.grade === 'Epic' ? 'rgba(158,80,112,0.25)' :
                    currentCard.grade === 'Rare' ? 'rgba(90,144,144,0.2)' :
                    'rgba(122,111,93,0.15)'
                  } 0%, transparent 70%)`
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.7, rotateY: -90, filter: 'brightness(1.8)' }}
                animate={{ opacity: 1, scale: 1, rotateY: 0, filter: 'brightness(1)' }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
                style={{ perspective: '800px' }}
                className={cn(
                  currentCard.grade === 'Legendary' ? 'animate-[legendaryFlash_1.2s_ease-out]' :
                  currentCard.grade === 'Epic' ? 'animate-[epicFlash_1s_ease-out]' :
                  currentCard.grade === 'Rare' ? 'animate-[rareFlash_0.8s_ease-out]' : ''
                , 'rounded-[4px]')}
              >
                <FolioCard card={currentCard} />
              </motion.div>

              {/* Card counter for multi-draw */}
              {drawnCards.length > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-2 font-serif text-[10px] text-folio-text-muted/30 tracking-wider"
                >
                  {revealIndex + 1} / {drawnCards.length} — 탭하여 계속
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Summary for multi-draw */}
          {phase === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="absolute inset-0 overflow-y-auto py-2"
            >
              <p className="font-serif text-[10px] text-folio-gold/50 tracking-[0.25em] uppercase text-center mb-3">획득 결과</p>
              <div className="grid grid-cols-3 gap-1.5">
                {drawnCards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                  >
                    <FolioCard card={card} compact className="w-full" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Draw Options ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
        className="w-full max-w-[19rem]"
      >
        {phase === 'idle' && (
          <div className="space-y-2">
            {DRAW_OPTIONS.map((opt) => (
              <button
                key={opt.count}
                onClick={() => handleDraw(opt)}
                disabled={points < opt.cost}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-[3px] transition-all duration-500 group",
                  opt.count === 1
                    ? "btn-gold-filled"
                    : "border border-folio-gold/30 bg-folio-surface/15 hover:bg-folio-gold/8 hover:border-folio-gold/50 disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className={cn("font-serif text-[12px] tracking-[0.1em]", opt.count === 1 ? "" : "text-folio-gold/80")}>{opt.label}</span>
                  <span className={cn("font-serif text-[9px] mt-0.5", opt.count === 1 ? "opacity-50" : "text-folio-text-muted/35")}>{opt.sub}</span>
                </div>
                <span className={cn("font-serif text-[12px] font-medium tracking-wider", opt.count === 1 ? "" : "text-folio-gold/60")}>{opt.cost} PT</span>
              </button>
            ))}
          </div>
        )}

        {(phase === 'reveal' && drawnCards.length === 1) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col items-center gap-3">
            <button onClick={() => handleDraw(DRAW_OPTIONS[0])} disabled={points < 100} className="btn-gold-filled w-full rounded-[3px]">
              <span>한 번 더</span>
              <span className="text-[0.8rem] opacity-60 font-light">100 PT</span>
            </button>
            <button onClick={handleReset} className="font-serif text-[11px] text-folio-text-muted/40 tracking-[0.2em] hover:text-folio-gold/50 transition-colors duration-500">
              돌아가기
            </button>
          </motion.div>
        )}

        {phase === 'summary' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-3 mt-3">
            <button onClick={handleReset} className="btn-gold w-full rounded-[3px]">
              확인
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* ── Pity & Odds ── */}
      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 w-full max-w-[19rem]"
        >
          {/* Pity counter */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-serif text-[9px] text-folio-text-muted/30 tracking-[0.15em]">
              Legendary 보장까지 <span className="text-folio-gold/50">{50 - pityCounter}</span>회
            </span>
            <button
              onClick={() => setShowOdds(!showOdds)}
              className="font-serif text-[8px] text-folio-text-muted/25 tracking-[0.15em] hover:text-folio-text-muted/40 transition-colors"
            >
              {showOdds ? '접기' : '확률 정보'}
            </button>
          </div>

          {/* Pity progress */}
          <div className="h-[3px] bg-folio-border/30 rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(pityCounter / 50) * 100}%` }}
              transition={{ duration: 0.8, ease: EASE }}
              className="h-full bg-gradient-to-r from-folio-gold/30 to-folio-gold/60 rounded-full"
            />
          </div>

          {/* Collapsible odds panel */}
          <AnimatePresence>
            {showOdds && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="p-3 border border-folio-border/40 rounded-[3px] bg-folio-surface/15">
                  <div className="space-y-2">
                    {RARITY_INFO.map(r => (
                      <div key={r.label} className="flex items-center gap-2.5">
                        <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: r.color, opacity: 0.6 }} />
                        <span className="font-serif text-[10px] w-8 shrink-0 tracking-wider" style={{ color: r.color, opacity: 0.5 }}>{r.short}</span>
                        <div className="flex-1 h-[3px] bg-folio-border/40 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(r.pct, 3)}%`, background: r.color, opacity: 0.5 }} />
                        </div>
                        <span className="font-serif text-[9px] text-folio-text-muted/30 w-7 text-right">{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
