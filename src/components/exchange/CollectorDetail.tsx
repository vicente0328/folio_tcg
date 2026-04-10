import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Card from '../Card';
import ProfileHeader from '../library/ProfileHeader';
import FeaturedCollection from '../library/FeaturedCollection';
import FollowButton from '../salon/FollowButton';
import { toUICard } from '../../lib/cardAdapter';
import { type InventoryCard } from '../../lib/firestore';
import { type UserProfile } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { getFollowers, getFollowing } from '../../lib/firestore';

interface CollectorDetailProps {
  collector: UserProfile;
  inventory: InventoryCard[];
  loading: boolean;
  onBack: () => void;
  onSelectCard: (card: InventoryCard) => void;
  isSelf: boolean;
}

export default function CollectorDetail({ collector, inventory, loading, onBack, onSelectCard, isSelf }: CollectorDetailProps) {
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    getFollowers(collector.uid).then(f => setFollowerCount(f.length));
    getFollowing(collector.uid).then(f => setFollowingCount(f.length));
  }, [collector.uid]);

  return (
    <div className="flex flex-col">
      {/* Back button */}
      <div className="px-5 pt-2 pb-1">
        <button onClick={onBack} className="text-brand-brown/50 hover:text-brand-brown transition-colors">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Profile Header */}
      <ProfileHeader
        displayName={collector.displayName}
        cardCount={inventory.length}
        followerCount={followerCount}
        followingCount={followingCount}
      >
        {!isSelf && <FollowButton targetUid={collector.uid} targetName={collector.displayName} />}
      </ProfileHeader>

      {/* Featured Collection */}
      <FeaturedCollection
        uid={collector.uid}
        isOwner={false}
      />

      {/* Card Grid */}
      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="w-8 h-8 rounded-full border-[0.5px] border-brand-brown/20 flex items-center justify-center animate-pulse">
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
            {inventory.map((card) => {
              const uiCard = toUICard(card, undefined);
              return (
                <motion.div
                  key={card.docId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-full h-[240px] relative overflow-hidden rounded-lg ${isSelf ? 'opacity-60' : 'cursor-pointer'}`}
                  onClick={() => !isSelf && onSelectCard(card)}
                >
                  <div
                    className="absolute top-0 left-0 origin-top-left"
                    style={{ transform: 'scale(0.6)' }}
                  >
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
  );
}
