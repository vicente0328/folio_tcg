import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import ProfileHeader from '../library/ProfileHeader';
import FeaturedCollection from '../library/FeaturedCollection';
import FollowButton from './FollowButton';
import FollowListOverlay from './FollowListOverlay';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { getUserInventoryWithIds, getCollectionLikes, getUserCollection, getFollowers, getFollowing, type InventoryCard } from '../../lib/firestore';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence } from 'motion/react';

interface UserLibraryOverlayProps {
  uid: string;
  displayName: string;
  onClose: () => void;
  onCardTap?: (card: InventoryCard) => void;
}

export default function UserLibraryOverlay({ uid, displayName, onClose, onCardTap }: UserLibraryOverlayProps) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionLikes, setCollectionLikes] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followListMode, setFollowListMode] = useState<'followers' | 'following' | null>(null);
  const isSelf = user?.uid === uid;

  useEffect(() => {
    getUserInventoryWithIds(uid).then(inv => { setInventory(inv); setLoading(false); });
    getUserCollection(uid).then(col => {
      if (col) getCollectionLikes(col.id).then(likes => setCollectionLikes(likes.length));
    });
    getFollowers(uid).then(f => setFollowerCount(f.length));
    getFollowing(uid).then(f => setFollowingCount(f.length));
  }, [uid]);

  return createPortal(
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[160] bg-brand-cream flex flex-col max-w-md mx-auto"
      style={{ height: '100dvh' }}
    >
      {/* Header */}
      <div className="flex items-center px-5 pt-14 pb-3 border-b border-brand-brown/10 flex-shrink-0">
        <button onClick={onClose} className="text-brand-brown/40 hover:text-brand-brown transition-colors">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <h3 className="font-serif text-brand-brown text-sm tracking-[0.15em] flex-1 text-center">{displayName}</h3>
        <div className="w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <ProfileHeader
          displayName={displayName}
          cardCount={inventory.length}
          collectionLikes={collectionLikes}
          followerCount={followerCount}
          followingCount={followingCount}
          onFollowersTap={() => setFollowListMode('followers')}
          onFollowingTap={() => setFollowListMode('following')}
        >
          {!isSelf && <FollowButton targetUid={uid} targetName={displayName} />}
        </ProfileHeader>

        <FeaturedCollection uid={uid} isOwner={false} />

        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 rounded-full border border-brand-brown/20 flex items-center justify-center animate-pulse">
              <span className="font-serif text-brand-brown/40 text-sm">F</span>
            </div>
          </div>
        ) : inventory.length === 0 ? (
          <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-12">No cards in this collection</p>
        ) : (
          <>
            <div className="flex flex-col items-center mb-4">
              <div className="w-8 h-[1px] bg-brand-brown/10 mb-3"></div>
              <span className="font-sans text-brand-brown/30 text-[8px] tracking-[0.3em] uppercase">
                {inventory.length} Cards
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 px-4 pb-24">
              {inventory.map(card => {
                const uiCard = toUICard(card, undefined);
                return (
                  <motion.div
                    key={card.docId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-full h-[240px] relative overflow-hidden rounded-lg ${isSelf ? 'opacity-60' : 'cursor-pointer'}`}
                    onClick={() => !isSelf && onCardTap?.(card)}
                  >
                    <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.6)' }}>
                      <Card card={uiCard} isRevealed={true} compact />
                    </div>
                    {isSelf && (
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <span className="text-[8px] text-brand-brown/30 tracking-widest uppercase">My Card</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Follow List Overlay */}
      <AnimatePresence>
        {followListMode && (
          <FollowListOverlay userId={uid} mode={followListMode} onClose={() => setFollowListMode(null)} />
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}
