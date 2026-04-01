import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, Gift, Recycle, ShoppingBag } from 'lucide-react';
import FolioCard from '../components/FolioCard';
import { CARDS, type CardData } from '../data/cards';
import { cn } from '../lib/utils';

const EASE = [0.25, 0.1, 0.25, 1] as const;

interface StoreProps {
  points: number;
  onEarnPoints: (amount: number) => void;
  onSpendPoints: (cost: number) => void;
}

const MISSIONS = [
  { id: 'visit', label: '서재 방문하기', reward: 10, icon: '📖' },
  { id: 'draw', label: '카드 1회 뽑기', reward: 20, icon: '✦' },
  { id: 'trade', label: '교환 1회 완료', reward: 30, icon: '⇄' },
  { id: 'streak3', label: '3일 연속 출석', reward: 50, icon: '🕯' },
];

const SPECIAL_PACKS = [
  { id: 'book', label: '작품 팩', desc: '특정 작품 카드 3장', cost: 300, color: '#c4a24d' },
  { id: 'rare', label: 'Rare↑ 팩', desc: 'Rare 이상 카드 3장', cost: 500, color: '#6ba3a3' },
  { id: 'author', label: '작가의 선택', desc: 'Epic 확률 2배 5장', cost: 800, color: '#c76d8a' },
];

// Mock rotating exchange cards
const getExchangeCards = () => {
  const pool = CARDS.filter(c => c.grade !== 'Legendary').slice(0, 50);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

const EXCHANGE_PRICES: Record<string, number> = {
  Common: 50,
  Rare: 200,
  Epic: 500,
  Legendary: 2000,
};

export default function Store({ points, onEarnPoints, onSpendPoints }: StoreProps) {
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set(['visit']));
  const [exchangeCards] = useState(() => getExchangeCards());
  const [purchasedExchange, setPurchasedExchange] = useState<Set<string>>(new Set());

  const handleMissionClaim = (mission: typeof MISSIONS[number]) => {
    if (completedMissions.has(mission.id)) return;
    setCompletedMissions(prev => new Set([...prev, mission.id]));
    onEarnPoints(mission.reward);
  };

  const handleExchangeBuy = (card: CardData) => {
    const price = EXCHANGE_PRICES[card.grade];
    if (points < price || purchasedExchange.has(card.card_id)) return;
    onSpendPoints(price);
    setPurchasedExchange(prev => new Set([...prev, card.card_id]));
  };

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="text-center mb-6"
      >
        <h2 className="font-serif text-[1.5rem] font-light tracking-[0.15em] text-folio-text">상점</h2>
        <p className="font-serif text-[10px] text-folio-text-muted/35 tracking-[0.15em] mt-1">
          문장 수집을 위한 다양한 경로
        </p>
        <div className="ornament-line-gold mt-4 w-16 mx-auto" />
      </motion.div>

      {/* ── Daily Missions ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
        className="mb-7"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift size={13} strokeWidth={1.2} className="text-folio-gold/40" />
            <span className="font-serif text-[10px] text-folio-text-muted/45 tracking-[0.2em] uppercase">일일 미션</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={10} strokeWidth={1.2} className="text-folio-text-muted/25" />
            <span className="font-serif text-[8px] text-folio-text-muted/25 tracking-wider">24:00:00</span>
          </div>
        </div>

        <div className="space-y-1.5">
          {MISSIONS.map((mission, i) => {
            const done = completedMissions.has(mission.id);
            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease: EASE }}
                className={cn(
                  "flex items-center justify-between px-3.5 py-3 rounded-[3px] border transition-all duration-400",
                  done
                    ? "border-folio-border/30 bg-folio-surface/10 opacity-50"
                    : "border-folio-border-light/30 bg-folio-surface/20 hover:border-folio-gold/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">{mission.icon}</span>
                  <span className={cn("font-serif text-[11px] tracking-[0.05em]", done ? "text-folio-text-muted/30 line-through" : "text-folio-text/70")}>{mission.label}</span>
                </div>
                {done ? (
                  <div className="w-5 h-5 rounded-full bg-folio-gold/15 flex items-center justify-center">
                    <Check size={10} strokeWidth={2} className="text-folio-gold/60" />
                  </div>
                ) : (
                  <button
                    onClick={() => handleMissionClaim(mission)}
                    className="font-serif text-[10px] text-folio-gold/70 tracking-wider px-2.5 py-1 border border-folio-gold/25 rounded-[2px] hover:bg-folio-gold/10 transition-colors"
                  >
                    +{mission.reward} PT
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ── Special Packs ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
        className="mb-7"
      >
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag size={13} strokeWidth={1.2} className="text-folio-gold/40" />
          <span className="font-serif text-[10px] text-folio-text-muted/45 tracking-[0.2em] uppercase">특별 컬렉션</span>
        </div>

        <div className="space-y-2">
          {SPECIAL_PACKS.map((pack, i) => (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.4, ease: EASE }}
              disabled={points < pack.cost}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-[3px] border border-folio-border-light/30 bg-folio-surface/15 hover:border-current/20 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed group"
              style={{ color: pack.color }}
            >
              <div className="flex items-center gap-3">
                {/* Pack visual */}
                <div className="w-10 h-13 rounded-[2px] border border-current/25 bg-current/5 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, currentColor 3px, currentColor 3.3px)`,
                  }} />
                  <span className="font-serif text-[14px] font-light relative z-10 opacity-60">F</span>
                </div>
                <div className="text-left">
                  <span className="block font-serif text-[12px] tracking-[0.08em] opacity-80">{pack.label}</span>
                  <span className="font-serif text-[9px] text-folio-text-muted/30">{pack.desc}</span>
                </div>
              </div>
              <span className="font-serif text-[12px] font-medium tracking-wider opacity-70">{pack.cost} PT</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ── Exchange Market ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
        className="mb-7"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Recycle size={13} strokeWidth={1.2} className="text-folio-gold/40" />
            <span className="font-serif text-[10px] text-folio-text-muted/45 tracking-[0.2em] uppercase">교환소</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={10} strokeWidth={1.2} className="text-folio-text-muted/25" />
            <span className="font-serif text-[8px] text-folio-text-muted/25 tracking-wider">갱신 24:00:00</span>
          </div>
        </div>

        <p className="font-serif text-[9px] text-folio-text-muted/25 mb-3 tracking-wider">매일 3장의 카드가 진열됩니다</p>

        <div className="grid grid-cols-3 gap-2">
          {exchangeCards.map((card, i) => {
            const bought = purchasedExchange.has(card.card_id);
            const price = EXCHANGE_PRICES[card.grade];
            return (
              <motion.div
                key={card.card_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.4, ease: EASE }}
                className="flex flex-col items-center"
              >
                <div className={cn("w-full relative", bought && "opacity-40")}>
                  <FolioCard card={card} compact className="w-full" />
                  {bought && (
                    <div className="absolute inset-0 flex items-center justify-center bg-folio-bg/50 rounded-[4px]">
                      <Check size={16} className="text-folio-gold/50" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleExchangeBuy(card)}
                  disabled={bought || points < price}
                  className="mt-1.5 w-full py-1.5 rounded-[2px] font-serif text-[9px] tracking-wider border border-folio-border-light/30 bg-folio-surface/15 text-folio-gold/60 hover:border-folio-gold/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {bought ? '구매 완료' : `${price} PT`}
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ── Duplicate Recycling ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Recycle size={13} strokeWidth={1.2} className="text-folio-gold/40" />
          <span className="font-serif text-[10px] text-folio-text-muted/45 tracking-[0.2em] uppercase">문장 환원</span>
        </div>

        <div className="p-4 border border-folio-border/40 rounded-[3px] bg-folio-surface/10 text-center">
          <p className="font-serif text-[11px] text-folio-text-muted/40 italic leading-relaxed mb-3">
            중복 카드를 포인트로 환원합니다
          </p>
          <div className="flex items-center justify-center gap-4 text-center">
            {[
              { grade: 'C', pt: 15, color: '#7a6f5d' },
              { grade: 'R', pt: 50, color: '#6ba3a3' },
              { grade: 'E', pt: 150, color: '#c76d8a' },
              { grade: 'L', pt: 500, color: '#c4a24d' },
            ].map(item => (
              <div key={item.grade} className="flex flex-col items-center gap-1">
                <span className="font-serif text-[10px] font-medium tracking-wider" style={{ color: item.color, opacity: 0.6 }}>{item.grade}</span>
                <span className="font-serif text-[9px] text-folio-text-muted/30">{item.pt} PT</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2.5 rounded-[2px] border border-folio-gold/20 font-serif text-[10px] text-folio-gold/50 tracking-[0.15em] hover:bg-folio-gold/5 transition-all">
            중복 카드 관리
          </button>
        </div>
      </motion.section>
    </div>
  );
}
