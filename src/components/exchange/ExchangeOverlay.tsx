import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Check, X as XIcon } from 'lucide-react';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { useAuth } from '../../context/AuthContext';
import {
  type Trade,
  type TradeMessage,
  getTradeMessages,
  sendTradeMessage,
} from '../../lib/firestore';

// ─── Types ───

interface ExchangeOverlayProps {
  open: boolean;
  onClose: () => void;
  incomingTrades: Trade[];
  outgoingTrades: Trade[];
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onWithdraw: (id: string) => Promise<void>;
  onRefresh: () => void;
}

// ─── Main Overlay ───

export default function ExchangeOverlay({
  open, onClose,
  incomingTrades, outgoingTrades,
  onAccept, onReject, onWithdraw, onRefresh,
}: ExchangeOverlayProps) {
  const { user } = useAuth();
  const [selectedTrade, setSelectedTrade] = useState<TradeWithDir | null>(null);

  // Merge and sort trades by date
  const allTrades: TradeWithDir[] = useMemo(() => {
    const merged: TradeWithDir[] = [
      ...incomingTrades.map(t => ({ ...t, _dir: 'incoming' as const })),
      ...outgoingTrades.map(t => ({ ...t, _dir: 'outgoing' as const })),
    ];
    return merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [incomingTrades, outgoingTrades]);

  // Keep selectedTrade in sync with trade list updates
  useEffect(() => {
    if (selectedTrade) {
      const updated = allTrades.find(t => t.id === selectedTrade.id);
      if (updated) setSelectedTrade(updated);
    }
  }, [allTrades]);

  const handleBack = () => setSelectedTrade(null);

  if (!open) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 bg-brand-cream z-[120] flex flex-col touch-none"
      style={{ height: '100dvh' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
    >
      <AnimatePresence mode="wait">
        {selectedTrade ? (
          <TradeChat
            key="chat"
            trade={selectedTrade}
            myUid={user?.uid || ''}
            onBack={handleBack}
            onAccept={onAccept}
            onReject={onReject}
            onWithdraw={onWithdraw}
            onRefresh={onRefresh}
          />
        ) : (
          <DMList
            key="list"
            trades={allTrades}
            myUid={user?.uid || ''}
            onSelect={setSelectedTrade}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}

// ─── DM List ───

interface DMListProps {
  trades: TradeWithDir[];
  myUid: string;
  onSelect: (t: TradeWithDir) => void;
  onClose: () => void;
}

function DMList({ trades, myUid, onSelect, onClose }: DMListProps) {
  const pendingCount = trades.filter(t => t.status === 'pending').length;

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="bg-brand-cream z-10 border-b border-brand-brown/10 px-5 pt-14 pb-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-full border border-brand-brown/15 flex items-center justify-center text-brand-brown/50 hover:text-brand-brown transition-colors">
          <XIcon size={16} strokeWidth={1.5} />
        </button>
        <span className="font-serif text-brand-brown text-sm tracking-[0.15em]">
          Messages
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-orange text-brand-cream text-[9px] font-bold">
              {pendingCount}
            </span>
          )}
        </span>
        <div className="w-8" />
      </div>

      {/* Trade list */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar touch-auto overscroll-contain">
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="font-serif text-brand-brown/20 text-4xl mb-4">F</span>
            <p className="text-brand-brown/40 text-[11px] tracking-wide">No trade requests yet</p>
          </div>
        ) : (
          trades.map(trade => {
            const isIncoming = trade._dir === 'incoming';
            const counterparty = isIncoming ? trade.from_user_name : trade.to_user_name;
            const initial = counterparty.charAt(0).toUpperCase();
            const previewCard = isIncoming ? trade.request_cards[0] : trade.request_cards[0];
            const previewText = isIncoming
              ? `Wants your ${previewCard?.book || 'card'}`
              : `You requested ${previewCard?.book || 'a card'}`;
            const statusColor = trade.status === 'pending'
              ? 'bg-brand-orange'
              : trade.status === 'accepted'
                ? 'bg-emerald-500'
                : 'bg-brand-brown/30';
            const time = formatTime(trade.createdAt);

            return (
              <button
                key={trade.id}
                onClick={() => onSelect(trade)}
                className="w-full flex items-center gap-3 px-5 py-4 border-b border-brand-brown/5 hover:bg-brand-brown/[0.02] transition-colors text-left"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-brand-brown/5 flex items-center justify-center flex-shrink-0 relative">
                  <span className="font-serif text-brand-brown/60 text-base">{initial}</span>
                  {trade.status === 'pending' && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-brand-orange border-2 border-brand-cream" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-serif text-[12px] tracking-wide truncate ${trade.status === 'pending' ? 'text-brand-brown font-medium' : 'text-brand-brown/60'}`}>
                      {counterparty}
                    </span>
                    <span className="text-[9px] text-brand-brown/30 tracking-wide ml-2 flex-shrink-0">{time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`} />
                    <p className="text-[10px] text-brand-brown/40 truncate">{previewText}</p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// ─── Trade Chat ───

type TradeWithDir = Trade & { _dir: 'incoming' | 'outgoing' };

interface TradeChatProps {
  trade: TradeWithDir;
  myUid: string;
  onBack: () => void;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onWithdraw: (id: string) => Promise<void>;
  onRefresh: () => void;
}

function TradeChat({ trade, myUid, onBack, onAccept, onReject, onWithdraw, onRefresh }: TradeChatProps) {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [processing, setProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isIncoming = trade._dir === 'incoming';
  const counterparty = isIncoming ? trade.from_user_name : trade.to_user_name;

  // Load messages
  useEffect(() => {
    getTradeMessages(trade.id).then(setMessages);
  }, [trade.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !userProfile) return;
    setSending(true);
    setText('');
    try {
      const msg = await sendTradeMessage(trade.id, myUid, userProfile.displayName, trimmed);
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleAction = async (action: () => Promise<void>) => {
    setProcessing(true);
    try {
      await action();
      onRefresh();
    } catch (err) {
      console.error('Trade action failed:', err);
    }
    setProcessing(false);
  };

  // Trade info card
  const requestCards = trade.request_cards;
  const offerCards = trade.offer_cards;

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="bg-brand-cream z-10 border-b border-brand-brown/10 px-4 pt-14 pb-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 rounded-full border border-brand-brown/15 flex items-center justify-center text-brand-brown/50 hover:text-brand-brown transition-colors">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <span className="font-serif text-brand-brown text-sm tracking-[0.1em] block truncate">{counterparty}</span>
        </div>
        <StatusBadge status={trade.status} />
      </div>

      {/* Scrollable area: trade info + messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar touch-auto overscroll-contain px-4 py-4">
        {/* Trade info card */}
        <div className="bg-brand-brown/[0.03] border border-brand-brown/10 rounded-sm p-4 mb-4">
          <p className="text-[8px] tracking-[0.3em] uppercase text-brand-brown/30 text-center mb-3">Trade Request</p>

          {/* Requested cards */}
          <div className="mb-3">
            <p className="text-[9px] tracking-[0.15em] uppercase text-brand-brown/40 mb-2">
              {isIncoming ? 'Wants from you' : 'You requested'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {requestCards.map((card, i) => {
                const ui = toUICard(card, i + 1);
                return (
                  <div key={card.card_id} className="w-[60px] h-[93px] relative overflow-hidden rounded-sm border border-brand-brown/10">
                    <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.234)' }}>
                      <Card card={ui} isRevealed={true} compact />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Offered */}
          <div className="mb-3">
            <p className="text-[9px] tracking-[0.15em] uppercase text-brand-brown/40 mb-2">
              {isIncoming ? 'They offer' : 'You offer'}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {trade.offer_points > 0 && (
                <span className="text-[11px] font-serif text-brand-orange font-medium">{trade.offer_points} pts</span>
              )}
              {offerCards.map((card, i) => {
                const ui = toUICard(card, i + 1);
                return (
                  <div key={card.card_id} className="w-[60px] h-[93px] relative overflow-hidden rounded-sm border border-brand-brown/10">
                    <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.234)' }}>
                      <Card card={ui} isRevealed={true} compact />
                    </div>
                  </div>
                );
              })}
              {offerCards.length === 0 && trade.offer_points === 0 && (
                <span className="text-[10px] text-brand-brown/30 italic">No offer</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {trade.status === 'pending' && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-brand-brown/5">
              {isIncoming ? (
                <>
                  <button
                    onClick={() => handleAction(() => onAccept(trade.id))}
                    disabled={processing}
                    className="flex-1 py-2 rounded-sm bg-brand-brown text-brand-cream text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-brand-brown/90 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check size={12} /> Accept
                  </button>
                  <button
                    onClick={() => handleAction(() => onReject(trade.id))}
                    disabled={processing}
                    className="flex-1 py-2 rounded-sm border border-brand-brown/15 text-brand-brown/50 text-[10px] tracking-[0.15em] uppercase hover:border-brand-brown/30 hover:text-brand-brown transition-colors"
                  >
                    Decline
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleAction(() => onWithdraw(trade.id))}
                  disabled={processing}
                  className="flex-1 py-2 rounded-sm border border-brand-brown/15 text-brand-brown/50 text-[10px] tracking-[0.15em] uppercase hover:border-brand-brown/30 hover:text-brand-brown transition-colors"
                >
                  Withdraw
                </button>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <p className="text-center text-brand-brown/20 text-[10px] tracking-wide py-6">No messages yet. Start the conversation!</p>
        ) : (
          <div className="space-y-2">
            {messages.map(msg => {
              const isMine = msg.from === myUid;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
                    isMine
                      ? 'bg-brand-brown text-brand-cream rounded-br-sm'
                      : 'bg-brand-brown/[0.06] text-brand-brown rounded-bl-sm'
                  }`}>
                    <p className="text-[12px] leading-relaxed break-words">{msg.text}</p>
                    <p className={`text-[8px] mt-1 ${isMine ? 'text-brand-cream/40' : 'text-brand-brown/25'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="flex-shrink-0 border-t border-brand-brown/10 bg-brand-cream px-4 py-3 pb-6 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Message..."
          className="flex-1 bg-brand-brown/[0.04] rounded-full px-4 py-2.5 text-[12px] text-brand-brown placeholder:text-brand-brown/25 focus:outline-none focus:ring-1 focus:ring-brand-brown/15 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            text.trim() ? 'bg-brand-brown text-brand-cream' : 'bg-brand-brown/10 text-brand-brown/20'
          }`}
        >
          <Send size={15} strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Helpers ───

function StatusBadge({ status }: { status: string }) {
  const style = status === 'pending'
    ? 'bg-brand-orange/10 text-brand-orange'
    : status === 'accepted'
      ? 'bg-emerald-50 text-emerald-600'
      : 'bg-brand-brown/5 text-brand-brown/30';
  const label = status === 'pending' ? 'Pending' : status === 'accepted' ? 'Accepted' : 'Declined';
  return (
    <span className={`px-2.5 py-1 rounded-full text-[8px] tracking-[0.15em] uppercase font-medium ${style}`}>
      {label}
    </span>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}
