import { useState } from 'react';
import { type Trade } from '../../lib/firestore';
import TradeItem from './TradeItem';

interface MyTradesProps {
  incoming: Trade[];
  outgoing: Trade[];
  onAccept: (tradeId: string) => Promise<void>;
  onReject: (tradeId: string) => Promise<void>;
  onWithdraw: (tradeId: string) => Promise<void>;
}

export default function MyTrades({ incoming, outgoing, onAccept, onReject, onWithdraw }: MyTradesProps) {
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingIncoming = incoming.filter(t => t.status === 'pending');
  const pendingOutgoing = outgoing.filter(t => t.status === 'pending');
  const resolvedIncoming = incoming.filter(t => t.status !== 'pending');
  const resolvedOutgoing = outgoing.filter(t => t.status !== 'pending');

  const handleAction = async (action: (id: string) => Promise<void>, tradeId: string) => {
    setProcessingId(tradeId);
    try {
      await action(tradeId);
    } catch {
      // Error handled by useExchange
    }
    setProcessingId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex justify-center gap-8">
        <button
          onClick={() => setTab('incoming')}
          className={`text-[10px] uppercase tracking-[0.2em] pb-1 border-b transition-all duration-300 ${
            tab === 'incoming' ? 'text-brand-brown border-brand-brown font-medium' : 'text-brand-brown/40 border-transparent'
          }`}
        >
          Received {pendingIncoming.length > 0 && `(${pendingIncoming.length})`}
        </button>
        <button
          onClick={() => setTab('outgoing')}
          className={`text-[10px] uppercase tracking-[0.2em] pb-1 border-b transition-all duration-300 ${
            tab === 'outgoing' ? 'text-brand-brown border-brand-brown font-medium' : 'text-brand-brown/40 border-transparent'
          }`}
        >
          Sent {pendingOutgoing.length > 0 && `(${pendingOutgoing.length})`}
        </button>
      </div>

      {/* Trade lists */}
      <div className="flex flex-col gap-4 pb-24">
        {tab === 'incoming' && (
          <>
            {pendingIncoming.length === 0 && resolvedIncoming.length === 0 && (
              <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-12">No trade proposals received yet</p>
            )}
            {pendingIncoming.map(t => (
              <TradeItem
                key={t.id}
                trade={t}
                direction="incoming"
                onAccept={(id) => handleAction(onAccept, id)}
                onReject={(id) => handleAction(onReject, id)}
                processing={processingId === t.id}
              />
            ))}
            {resolvedIncoming.length > 0 && pendingIncoming.length > 0 && (
              <div className="w-full h-[1px] bg-brand-brown/10 my-2"></div>
            )}
            {resolvedIncoming.map(t => (
              <TradeItem key={t.id} trade={t} direction="incoming" />
            ))}
          </>
        )}
        {tab === 'outgoing' && (
          <>
            {pendingOutgoing.length === 0 && resolvedOutgoing.length === 0 && (
              <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-12">No trade proposals sent yet</p>
            )}
            {pendingOutgoing.map(t => (
              <TradeItem
                key={t.id}
                trade={t}
                direction="outgoing"
                onWithdraw={(id) => handleAction(onWithdraw, id)}
                processing={processingId === t.id}
              />
            ))}
            {resolvedOutgoing.length > 0 && pendingOutgoing.length > 0 && (
              <div className="w-full h-[1px] bg-brand-brown/10 my-2"></div>
            )}
            {resolvedOutgoing.map(t => (
              <TradeItem key={t.id} trade={t} direction="outgoing" />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
