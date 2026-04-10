import { useState, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import SalonTab from './salon/SalonTab';
import PostComposer from './salon/PostComposer';
import PostDetail from './salon/PostDetail';
import SalonCardPreview from './salon/SalonCardPreview';
import UserLibraryOverlay from './salon/UserLibraryOverlay';
import TradeProposalModal from './exchange/TradeProposalModal';
import { type Post, type InventoryCard } from '../lib/firestore';
import { type CardData } from '../data/cards';
import { type UserProfile } from '../context/AuthContext';
import { useExchange } from '../hooks/useExchange';

export default function Salon() {
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [previewCard, setPreviewCard] = useState<{ card: CardData; ownerUid: string; ownerName: string } | null>(null);
  const [viewUser, setViewUser] = useState<{ uid: string; name: string } | null>(null);
  const [tradeTarget, setTradeTarget] = useState<{ card: InventoryCard; collector: UserProfile } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const exchange = useExchange();

  const handlePosted = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleCardTap = useCallback((card: CardData, ownerUid: string, ownerName?: string) => {
    setPreviewCard({ card, ownerUid, ownerName: ownerName || '' });
  }, []);

  const handleAuthorTap = useCallback((uid: string, name: string) => {
    setViewUser({ uid, name });
  }, []);

  const handleProposeTrade = useCallback((card: InventoryCard, ownerUid: string, ownerName: string) => {
    setPreviewCard(null);
    setTradeTarget({
      card,
      collector: { uid: ownerUid, displayName: ownerName, email: '', points: 0, lastAttendance: null, attendanceStreak: 0, wishlist: [] },
    });
  }, []);

  return (
    <>
      <SalonTab
        key={refreshKey}
        onCompose={() => setShowComposer(true)}
        onPostTap={(post) => setSelectedPost(post)}
        onCardTap={handleCardTap}
        onAuthorTap={handleAuthorTap}
      />

      <AnimatePresence>
        {showComposer && (
          <PostComposer onClose={() => setShowComposer(false)} onPosted={handlePosted} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPost && (
          <PostDetail
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onDeleted={handlePosted}
            onCardTap={handleCardTap}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewCard && (
          <SalonCardPreview
            card={previewCard.card}
            ownerUid={previewCard.ownerUid}
            onClose={() => setPreviewCard(null)}
            onProposeTrade={(card, uid) => handleProposeTrade(card, uid, previewCard.ownerName)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewUser && (
          <UserLibraryOverlay
            uid={viewUser.uid}
            displayName={viewUser.name}
            onClose={() => setViewUser(null)}
            onCardTap={(card) => {
              setViewUser(null);
              handleProposeTrade(card, card.current_owner || viewUser.uid, viewUser.name);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tradeTarget && (
          <TradeProposalModal
            targetCard={tradeTarget.card}
            targetCollector={tradeTarget.collector}
            onClose={() => setTradeTarget(null)}
            onSubmit={exchange.proposeTrade}
          />
        )}
      </AnimatePresence>
    </>
  );
}
