import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useExchange } from '../hooks/useExchange';
import { type InventoryCard } from '../lib/firestore';
import { type UserProfile } from '../context/AuthContext';
import CollectorList from './exchange/CollectorList';
import CollectorDetail from './exchange/CollectorDetail';
import MyTrades from './exchange/MyTrades';
import TradeProposalModal from './exchange/TradeProposalModal';
import { useAuth } from '../context/AuthContext';

type SubView = 'collectors' | 'trades';

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
    selectCollector,
    proposeTrade,
    handleAcceptTrade,
    handleRejectTrade,
    handleWithdrawTrade,
  } = useExchange();

  const [subView, setSubView] = useState<SubView>('collectors');
  const [tradeTarget, setTradeTarget] = useState<{ card: InventoryCard; collector: UserProfile } | null>(null);

  const isSelf = selectedCollector?.uid === user?.uid;

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex flex-col items-center mb-8 text-center pt-4">
        <span className="font-serif text-brand-brown/50 text-[10px] tracking-[0.4em] uppercase mb-2">Trade</span>
        <h2 className="font-serif text-2xl tracking-[0.2em] uppercase text-brand-brown">Exchange</h2>
        <div className="w-8 h-[1px] bg-brand-brown/20 mt-4"></div>
      </div>

      {/* Sub-tabs */}
      <div className="flex justify-center gap-8 mb-8">
        <button
          onClick={() => { setSubView('collectors'); selectCollector(null); }}
          className={`text-[10px] uppercase tracking-[0.2em] pb-1 border-b transition-all duration-300 ${
            subView === 'collectors' ? 'text-brand-brown border-brand-brown font-medium' : 'text-brand-brown/40 border-transparent'
          }`}
        >
          Collectors
        </button>
        <button
          onClick={() => { setSubView('trades'); selectCollector(null); }}
          className={`text-[10px] uppercase tracking-[0.2em] pb-1 border-b transition-all duration-300 relative ${
            subView === 'trades' ? 'text-brand-brown border-brand-brown font-medium' : 'text-brand-brown/40 border-transparent'
          }`}
        >
          My Trades
          {pendingIncomingCount > 0 && subView !== 'trades' && (
            <span className="absolute -top-1.5 -right-4 w-4 h-4 rounded-full bg-brand-orange text-brand-cream text-[8px] flex items-center justify-center font-medium">
              {pendingIncomingCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
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
          onSelectCard={(card) => setTradeTarget({ card, collector: selectedCollector })}
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

      {/* Trade Proposal Modal */}
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
