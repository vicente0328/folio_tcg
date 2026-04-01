import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRightLeft } from 'lucide-react';
import FolioCard from '../components/FolioCard';
import { getRandomCard, type CardData } from '../data/cards';
import { cn } from '../lib/utils';

export default function Trade() {
  const [selected, setSelected] = useState<CardData[]>([]);
  const [result, setResult] = useState<CardData | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [myCards] = useState(() => Array.from({ length: 6 }, () => getRandomCard()));

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
      setResult(getRandomCard());
      setSelected([]);
      setIsTrading(false);
    }, 2200);
  };

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-serif text-[1.5rem] font-light tracking-[0.15em] text-folio-text mb-1.5">문장 교환</h2>
        <p className="font-serif text-[10px] text-folio-text-muted/40 tracking-[0.15em] leading-relaxed">
          세 개의 문장을 바쳐 새로운 영감을 얻습니다
        </p>
        <div className="ornament-line-gold mt-4 w-16 mx-auto" />
      </div>

      {/* Arena */}
      <div className="flex flex-col items-center justify-center min-h-[32vh] mb-5 relative">
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
                      <motion.div key={i} animate={{ x, y }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
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

      {/* Card selection */}
      {!result && (
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="font-serif text-[9px] text-folio-text-muted/30 tracking-[0.2em] uppercase">내 카드 선택</span>
            <span className="font-serif text-[9px] text-folio-gold/40">{selected.length} / 3</span>
          </div>
          <div className="ornament-line mb-3" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-2">
            {myCards.map((card, i) => {
              const sel = !!selected.find(c => c.card_id === card.card_id);
              return (
                <div key={card.card_id + i} onClick={() => !isTrading && toggleSelect(card)}
                  className={cn("shrink-0 w-[5rem] aspect-[2/3] cursor-pointer transition-all duration-400 relative rounded-[3px] overflow-hidden",
                    sel ? "ring-1 ring-folio-gold/35 scale-[0.93] opacity-40" : "hover:-translate-y-1")}>
                  <FolioCard card={card} compact className="w-full h-full pointer-events-none" />
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
