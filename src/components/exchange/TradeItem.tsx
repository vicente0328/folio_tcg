import { motion } from 'motion/react';
import { Check, X, Undo2 } from 'lucide-react';
import { type Trade } from '../../lib/firestore';

interface TradeItemProps {
  trade: Trade;
  direction: 'incoming' | 'outgoing';
  onAccept?: (tradeId: string) => void;
  onReject?: (tradeId: string) => void;
  onWithdraw?: (tradeId: string) => void;
  processing?: boolean;
}

const GRADE_COLORS: Record<string, string> = {
  Legendary: 'text-brand-gold',
  Epic: 'text-purple-500',
  Rare: 'text-gray-400',
  Common: 'text-brand-brown/50',
};

export default function TradeItem({ trade, direction, onAccept, onReject, onWithdraw, processing }: TradeItemProps) {
  const isPending = trade.status === 'pending';
  const statusLabel = trade.status === 'accepted' ? 'Accepted' : trade.status === 'rejected' ? 'Declined' : 'Pending';
  const statusColor = trade.status === 'accepted' ? 'text-green-600 bg-green-50' : trade.status === 'rejected' ? 'text-brand-brown/40 bg-brand-brown/5' : 'text-brand-orange bg-brand-orange/10';

  const otherUser = direction === 'incoming' ? trade.from_user_name : trade.to_user_name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-brand-brown/10 rounded-lg p-5 bg-brand-cream relative"
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-serif text-[11px] text-brand-brown/60 italic">{otherUser}</span>
        <span className={`text-[8px] tracking-[0.2em] uppercase font-medium px-2 py-0.5 rounded-sm ${statusColor}`}>{statusLabel}</span>
      </div>

      {/* What they want (request) */}
      <div className="mb-3">
        <span className="text-[8px] tracking-[0.2em] uppercase text-brand-brown/40 block mb-1.5">
          {direction === 'incoming' ? 'Wants from you' : 'You want'}
        </span>
        <div className="flex flex-wrap gap-2">
          {trade.request_cards.map((card, i) => (
            <div key={i} className="bg-brand-brown/5 rounded px-2.5 py-1.5">
              <span className={`text-[9px] font-medium ${GRADE_COLORS[card.grade] || ''}`}>{card.grade?.[0]}</span>
              <span className="text-[10px] text-brand-brown ml-1 font-serif">{card.book}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 my-3">
        <div className="flex-1 h-[1px] bg-brand-brown/10"></div>
        <span className="text-[8px] text-brand-brown/30 tracking-widest uppercase">in exchange for</span>
        <div className="flex-1 h-[1px] bg-brand-brown/10"></div>
      </div>

      {/* What they offer */}
      <div className="mb-4">
        <span className="text-[8px] tracking-[0.2em] uppercase text-brand-brown/40 block mb-1.5">
          {direction === 'incoming' ? 'They offer' : 'You offer'}
        </span>
        <div className="flex flex-wrap gap-2 items-center">
          {trade.offer_points > 0 && (
            <div className="bg-brand-orange/10 rounded px-2.5 py-1.5">
              <span className="text-[10px] text-brand-orange font-medium">{trade.offer_points} pts</span>
            </div>
          )}
          {trade.offer_cards.map((card, i) => (
            <div key={i} className="bg-brand-brown/5 rounded px-2.5 py-1.5">
              <span className={`text-[9px] font-medium ${GRADE_COLORS[card.grade] || ''}`}>{card.grade?.[0]}</span>
              <span className="text-[10px] text-brand-brown ml-1 font-serif">{card.book}</span>
            </div>
          ))}
          {trade.offer_points === 0 && trade.offer_cards.length === 0 && (
            <span className="text-[10px] text-brand-brown/30 italic">Nothing</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-3 mt-2">
          {direction === 'incoming' && (
            <>
              <button
                onClick={() => onAccept?.(trade.id)}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-1.5 bg-brand-brown text-brand-cream py-2 rounded-sm text-[9px] tracking-[0.15em] uppercase font-medium hover:bg-brand-brown/90 transition-colors disabled:opacity-50"
              >
                <Check size={12} strokeWidth={2} />
                Accept
              </button>
              <button
                onClick={() => onReject?.(trade.id)}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-1.5 border border-brand-brown/20 text-brand-brown/60 py-2 rounded-sm text-[9px] tracking-[0.15em] uppercase font-medium hover:border-brand-brown/40 transition-colors disabled:opacity-50"
              >
                <X size={12} strokeWidth={2} />
                Decline
              </button>
            </>
          )}
          {direction === 'outgoing' && (
            <button
              onClick={() => onWithdraw?.(trade.id)}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-1.5 border border-brand-brown/20 text-brand-brown/60 py-2 rounded-sm text-[9px] tracking-[0.15em] uppercase font-medium hover:border-brand-brown/40 transition-colors disabled:opacity-50"
            >
              <Undo2 size={12} strokeWidth={1.5} />
              Withdraw
            </button>
          )}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-[8px] text-brand-brown/25 mt-3 text-right tracking-wide">
        {trade.createdAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
      </p>
    </motion.div>
  );
}
