import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRightLeft } from 'lucide-react';
import { useExchange } from '../hooks/useExchange';
import { type InventoryCard } from '../lib/firestore';
import { type UserProfile } from '../context/AuthContext';
import Card from './Card';
import { toUICard } from '../lib/cardAdapter';
import Discover from './exchange/Discover';
import CollectorList from './exchange/CollectorList';
import CollectorDetail from './exchange/CollectorDetail';
import MyTrades from './exchange/MyTrades';
import TradeProposalModal from './exchange/TradeProposalModal';
import { useAuth } from '../context/AuthContext';

type SubView = 'discover' | 'collectors' | 'trades';

export default function Market() {
  const { user } = useAuth();
  const {
    collectors,
    selectedCollector,
    collectorInventory,
    incomingTrades,
    outgoingTrades,
    loading,
    loadingInventory,
    pendingIncomingCount,
    allOtherCards,
    allCardsLoaded,
    selectCollector,
    proposeTrade,
    handleAcceptTrade,
    handleRejectTrade,
    handleWithdrawTrade,
  } = useExchange();

  const [subView, setSubView] = useState<SubView>('discover');
  // Step 1: Card preview (tap to flip, with Propose Trade button)
  const [previewTarget, setPreviewTarget] = useState<{ card: InventoryCard; collector: UserProfile } | null>(null);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  // Step 2: Trade proposal modal
  const [tradeTarget, setTradeTarget] = useState<{ card: InventoryCard; collector: UserProfile } | null>(null);

  const isSelf = selectedCollector?.uid === user?.uid;

  const openPreview = (card: InventoryCard, collector: UserProfile) => {
    setPreviewFlipped(false);
    setPreviewTarget({ card, collector });
  };

  const closePreview = () => {
    setPreviewTarget(null);
    setPreviewFlipped(false);
  };

  const openTradeFromPreview = () => {
    if (!previewTarget) return;
    setTradeTarget(previewTarget);
    closePreview();
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex flex-col items-center mb-8 text-center pt-4">
        <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">Trade</span>
        <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Exchange</h2>
        <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
      </div>

      {/* Sub-tabs */}
      <div className="flex justify-center gap-6 mb-8">
        {(['discover', 'collectors', 'trades'] as const).map((tab) => {
          const labels = { discover: 'Discover', collectors: 'Collectors', trades: 'My Trades' };
          const isActive = subView === tab;
          return (
            <button
              key={tab}
              onClick={() => { setSubView(tab); if (tab !== 'collectors') selectCollector(null); }}
              className={`text-[10px] uppercase tracking-[0.2em] pb-1 border-b transition-all duration-300 relative ${
                isActive ? 'text-brand-brown border-brand-brown font-medium' : 'text-brand-brown/40 border-transparent'
              }`}
            >
              {labels[tab]}
              {tab === 'trades' && pendingIncomingCount > 0 && !isActive && (
                <span className="absolute -top-1.5 -right-4 w-4 h-4 rounded-full bg-brand-orange text-brand-cream text-[8px] flex items-center justify-center font-medium">
                  {pendingIncomingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {subView === 'discover' && (
        <Discover
          allCards={allOtherCards}
          loading={!allCardsLoaded}
          onSelectCard={(card, collector) => openPreview(card, collector)}
          collectors={collectors}
        />
      )}

      {subView === 'collectors' && !selectedCollector && (
        <CollectorList
          collectors={collectors}
          loading={loading}
          onSelectCollector={(c) => selectCollector(c)}
        />
      )}

      {subView === 'collectors' && selectedCollector && (
        <CollectorDetail
          collector={selectedCollector}
          inventory={collectorInventory}
          loading={loadingInventory}
          onBack={() => selectCollector(null)}
          onSelectCard={(card) => openPreview(card, selectedCollector)}
          isSelf={isSelf || false}
        />
      )}

      {subView === 'trades' && (
        <MyTrades
          incoming={incomingTrades}
          outgoing={outgoingTrades}
          onAccept={handleAcceptTrade}
          onReject={handleRejectTrade}
          onWithdraw={handleWithdrawTrade}
        />
      )}

      {/* ═══ Card Preview Overlay ═══ */}
      <AnimatePresence>
        {previewTarget && (
          <CardPreviewOverlay
            card={previewTarget.card}
            collector={previewTarget.collector}
            flipped={previewFlipped}
            onFlip={() => setPreviewFlipped(prev => !prev)}
            onClose={closePreview}
            onProposeTrade={openTradeFromPreview}
          />
        )}
      </AnimatePresence>

      {/* ═══ Trade Proposal Modal ═══ */}
      <AnimatePresence>
        {tradeTarget && (
          <TradeProposalModal
            targetCard={tradeTarget.card}
            targetCollector={tradeTarget.collector}
            onClose={() => setTradeTarget(null)}
            onSubmit={proposeTrade}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CardPreviewOverlay({
  card,
  collector,
  flipped,
  onFlip,
  onClose,
  onProposeTrade,
}: {
  card: InventoryCard;
  collector: UserProfile;
  flipped: boolean;
  onFlip: () => void;
  onClose: () => void;
  onProposeTrade: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const uiCard = toUICard(card, undefined);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 bg-brand-cream/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center"
    >
      {/* Close button */}
      <motion.button
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute top-14 right-5 z-[210] w-10 h-10 rounded-full border border-brand-brown/15 flex items-center justify-center text-brand-brown/50 hover:text-brand-brown hover:border-brand-brown/30 transition-colors"
      >
        <X size={18} strokeWidth={1.5} />
      </motion.button>

      {/* Owner label */}
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4 font-serif text-brand-brown/40 text-[10px] tracking-[0.2em] uppercase"
      >
        {collector.displayName}'s card
      </motion.p>

      {/* Card — tap to flip */}
      <motion.div
        className="cursor-pointer"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 0.8 }}
        onClick={onFlip}
      >
        <Card
          card={uiCard}
          isRevealed={true}
          isFlipped={flipped}
        />
      </motion.div>

      {/* Hint text */}
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="mt-6 font-sans text-brand-brown/40 text-[9px] tracking-[0.2em] uppercase"
      >
        {flipped ? 'Tap to see front' : 'Tap to read Between the Lines'}
      </motion.span>

      {/* Propose Trade button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        onClick={onProposeTrade}
        className="mt-8 flex items-center gap-2 bg-brand-brown text-brand-cream px-8 py-3 rounded-sm text-[10px] tracking-[0.2em] uppercase font-medium hover:bg-brand-brown/90 transition-colors shadow-lg"
      >
        <ArrowRightLeft size={14} strokeWidth={1.5} />
        Propose Trade
      </motion.button>
    </motion.div>
  );
}
