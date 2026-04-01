import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRightLeft } from 'lucide-react';
import FolioCard from '../components/FolioCard';
import { CARDS, type CardData } from '../data/cards';
import { cn } from '../lib/utils';

const EASE = [0.25, 0.1, 0.25, 1] as const;
const GRADE_ORDER: Record<string, number> = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
const GRADE_UP: Record<string, CardData['grade']> = { Common: 'Rare', Rare: 'Epic', Epic: 'Legendary' };

function getUpgradeResult(selected: CardData[]): CardData {
  // If all 3 are the same grade, guarantee next tier
  const allSameGrade = selected.every(c => c.grade === selected[0].grade);
  if (allSameGrade && GRADE_UP[selected[0].grade]) {
    const targetGrade = GRADE_UP[selected[0].grade];
    const pool = CARDS.filter(c => c.grade === targetGrade);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Otherwise weighted by average input rarity
  const avgOrder = selected.reduce((sum, c) => sum + (GRADE_ORDER[c.grade] || 0), 0) / selected.length;
  let roll = Math.random() * 100;
  let grade: CardData['grade'];

  if (avgOrder >= 2) {
    // High input → better odds
    if (roll < 8) grade = 'Legendary';
    else if (roll < 30) grade = 'Epic';
    else if (roll < 65) grade = 'Rare';
    else grade = 'Common';
  } else if (avgOrder >= 1) {
    if (roll < 4) grade = 'Legendary';
    else if (roll < 18) grade = 'Epic';
    else if (roll < 50) grade = 'Rare';
    else grade = 'Common';
  } else {
    if (roll < 2) grade = 'Legendary';
    else if (roll < 10) grade = 'Epic';
    else if (roll < 35) grade = 'Rare';
    else grade = 'Common';
  }

  const pool = CARDS.filter(c => c.grade === grade);
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function Trade() {
  const [selected, setSelected] = useState<CardData[]>([]);
  const [result, setResult] = useState<CardData | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [myCards] = useState(() => {
    const shuffled = [...CARDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9);
  });

  const toggleSelect = (card: CardData) => {
    if (selected.find(c => c.card_id === card.card_id)) {
      setSelected(selected.filter(c => c.card_id !== card.card_id));
    } else if (selected.length < 3) {
      setSelected([...selected, card]);
    }
  };

  const handleTrade = () => {
    if (selected.length !== 3) return;
    setIsTrading(true);
    setTimeout(() => {
      setResult(getUpgradeResult(selected));
      setSelected([]);
      setIsTrading(false);
    }, 2200);
  };

  // Check if all selected are same grade for upgrade hint
  const upgradeHint = useMemo(() => {
    if (selected.length !== 3) return null;
    const allSame = selected.every(c => c.grade === selected[0].grade);
    if (allSame && GRADE_UP[selected[0].grade]) {
      return `${GRADE_UP[selected[0].grade]} 등급 보장!`;
    }
    return null;
  }, [selected]);

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="text-center mb-5"
      >
        <h2 className="font-serif text-[1.5rem] font-light tracking-[0.15em] text-folio-text mb-1.5">문장 교환</h2>
        <p className="font-serif text-[10px] text-folio-text-muted/40 tracking-[0.15em] leading-relaxed">
          세 개의 문장을 바쳐 새로운 영감을 얻습니다
        </p>
        <div className="ornament-line-gold mt-4 w-16 mx-auto" />
      </motion.div>

      {/* ── Upgrade Rule Info ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-5 px-3 py-2.5 border border-folio-border/30 rounded-[3px] bg-folio-surface/10"
      >
        <p className="font-serif text-[9px] text-folio-text-muted/35 tracking-[0.15em] text-center leading-relaxed">
          같은 등급 3장 교환 시 상위 등급 보장
          <span className="text-folio-text-muted/20 mx-1.5">·</span>
          <span className="text-folio-gold/40">3C → 1R</span>
          <span className="text-folio-text-muted/20 mx-1">·</span>
          <span className="text-folio-gold/40">3R → 1E</span>
          <span className="text-folio-text-muted/20 mx-1">·</span>
          <span className="text-folio-gold/40">3E → 1L</span>
        </p>
      </motion.div>

      {/* ── Arena ── */}
      <div className="flex flex-col items-center justify-center min-h-[30vh] mb-4 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <div className="w-44 h-44 border-[0.5px] border-folio-gold rounded-full animate-[rotateSlowCW_50s_linear_infinite]" />
          <div className="w-28 h-28 border-[0.5px] border-folio-gold rounded-full border-dashed animate-[rotateSlowCCW_35s_linear_infinite] absolute" />
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="arena" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative w-full aspect-square max-w-[14rem] flex items-center justify-center">
              {isTrading ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.8, 1.1, 1], opacity: 1, rotate: [0, 180, 360] }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full border border-folio-gold/30 flex items-center justify-center bg-folio-surface/50 shadow-[0_0_30px_rgba(196,162,77,0.15)]"
                >
                  <ArrowRightLeft size={24} strokeWidth={1} className="text-folio-gold/60" />
                </motion.div>
              ) : (
                <>
                  {[0, 1, 2].map(i => {
                    const angle = (i * 120 - 90) * (Math.PI / 180);
                    const x = Math.cos(angle) * 65;
                    const y = Math.sin(angle) * 65;
                    const card = selected[i];
                    return (
                      <motion.div key={i} animate={{ x, y }} transition={{ duration: 0.4, ease: EASE }}
                        className="absolute w-[4.8rem] aspect-[2/3] rounded-[3px] border border-folio-border-light/35 bg-folio-surface/20 flex items-center justify-center overflow-hidden"
                        style={{ boxShadow: card ? '0 4px 12px rgba(0,0,0,0.3)' : 'none' }}>
                        {card ? (
                          <div className="w-full h-full cursor-pointer relative group" onClick={() => toggleSelect(card)}>
                            <FolioCard card={card} compact className="w-full h-full pointer-events-none" />
                            <div className="absolute inset-0 bg-folio-bg/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="font-serif text-[7px] text-folio-text/50 tracking-[0.2em] uppercase">제거</span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-serif text-lg text-folio-border-light/25 font-light">+</span>
                        )}
                      </motion.div>
                    );
                  })}
                  <div className="w-7 h-7 rounded-full border-[0.5px] border-folio-gold/15 flex items-center justify-center z-10 bg-folio-bg/40">
                    <span className="text-folio-gold/20 text-[6px]">&#10043;</span>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }} className="flex flex-col items-center">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: 3, duration: 0.8 }}
                className="font-serif text-[10px] text-folio-gold/50 tracking-[0.3em] uppercase mb-4">New Insight</motion.span>
              <FolioCard card={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upgrade hint */}
      <AnimatePresence>
        {upgradeHint && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-center mb-2"
          >
            <span className="font-serif text-[10px] text-folio-gold/70 tracking-[0.15em]">{upgradeHint}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade button */}
      {!result && !isTrading && (
        <button onClick={handleTrade} disabled={selected.length !== 3} className="btn-gold-filled w-full max-w-[16rem] mx-auto rounded-[3px] mb-5">
          <ArrowRightLeft size={15} strokeWidth={1.3} />
          <span>교환하기</span>
          <span className="text-[0.8rem] opacity-40">{selected.length}/3</span>
        </button>
      )}
      {result && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          onClick={() => setResult(null)}
          className="font-serif text-[11px] text-folio-text-muted/35 tracking-[0.15em] hover:text-folio-gold/50 transition-colors mx-auto mb-5">
          다시 교환하기
        </motion.button>
      )}

      {/* ── Card Selection ── */}
      {!result && (
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="font-serif text-[9px] text-folio-text-muted/30 tracking-[0.2em] uppercase">내 카드 선택</span>
            <span className="font-serif text-[9px] text-folio-gold/40">{selected.length} / 3</span>
          </div>
          <div className="ornament-line mb-3" />
          <div className="grid grid-cols-3 gap-1.5 pb-2">
            {myCards.map((card, i) => {
              const sel = !!selected.find(c => c.card_id === card.card_id);
              return (
                <div key={card.card_id + i} onClick={() => !isTrading && toggleSelect(card)}
                  className={cn("cursor-pointer transition-all duration-400 relative rounded-[3px] overflow-hidden",
                    sel ? "ring-1 ring-folio-gold/35 scale-[0.93] opacity-40" : "hover:-translate-y-1")}>
                  <FolioCard card={card} compact className="w-full pointer-events-none" />
                  {sel && (
                    <div className="absolute inset-0 bg-folio-bg/40 flex items-center justify-center z-20">
                      <div className="w-4 h-4 rounded-full border border-folio-gold/40 flex items-center justify-center bg-folio-bg/60">
                        <span className="text-folio-gold text-[7px]">&#10003;</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
