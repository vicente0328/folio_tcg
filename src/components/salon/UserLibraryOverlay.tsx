import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import ProfileHeader from '../library/ProfileHeader';
import FeaturedCollection from '../library/FeaturedCollection';
import FollowButton from './FollowButton';
import FollowListOverlay from './FollowListOverlay';
import PostCard from './PostCard';
import Card from '../Card';
import { toUICard } from '../../lib/cardAdapter';
import { getUserInventoryWithIds, getFollowers, getFollowing, getPostsByUser, getLikedCards, type InventoryCard, type Post } from '../../lib/firestore';
import { type CardData } from '../../data/cards';
import { useAuth } from '../../context/AuthContext';

interface UserLibraryOverlayProps {
  uid: string;
  displayName: string;
  onClose: () => void;
  onCardTap?: (card: InventoryCard) => void;
  onPostTap?: (post: Post) => void;
  onPostCardTap?: (card: CardData, ownerUid: string, ownerName: string) => void;
}

type SubTab = 'posts' | 'cards';

export default function UserLibraryOverlay({ uid, displayName, onClose, onCardTap, onPostTap, onPostCardTap }: UserLibraryOverlayProps) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followListMode, setFollowListMode] = useState<'followers' | 'following' | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [likedCards, setLikedCards] = useState<CardData[]>([]);
  const [likedCardsLoading, setLikedCardsLoading] = useState(true);
  const isSelf = user?.uid === uid;

  useEffect(() => {
    getUserInventoryWithIds(uid).then(inv => { setInventory(inv); setLoading(false); });
    getFollowers(uid).then(f => setFollowerCount(f.length));
    getFollowing(uid).then(f => setFollowingCount(f.length));
    getPostsByUser(uid).then(p => { setPosts(p); setPostsLoading(false); });
    getLikedCards(uid).then(c => { setLikedCards(c); setLikedCardsLoading(false); });
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
          followerCount={followerCount}
          followingCount={followingCount}
          onFollowersTap={() => setFollowListMode('followers')}
          onFollowingTap={() => setFollowListMode('following')}
        >
          {!isSelf && <FollowButton targetUid={uid} targetName={displayName} />}
        </ProfileHeader>

        <FeaturedCollection uid={uid} isOwner={false} />

        {/* Sub Tabs */}
        <div className="flex justify-center gap-8 mt-2 mb-4">
          {(['posts', 'cards'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`text-[10px] uppercase tracking-[0.2em] pb-1 transition-colors ${subTab === tab ? 'text-brand-brown border-b border-brand-brown font-medium' : 'text-brand-brown/40 hover:text-brand-brown'}`}
            >
              {tab === 'posts' ? 'Posts' : 'Liked Cards'}
            </button>
          ))}
        </div>

        {/* Posts Sub Tab */}
        {subTab === 'posts' && (
          postsLoading ? (
            <div className="flex justify-center pt-16">
              <div className="w-8 h-8 rounded-full border border-brand-brown/20 flex items-center justify-center animate-pulse">
                <span className="font-serif text-brand-brown/40 text-sm">F</span>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-12">No posts yet</p>
          ) : (
            <div className="pb-24">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onTap={() => onPostTap?.(post)}
                  onCardTap={(card) => onPostCardTap?.(card, post.authorUid, post.authorName)}
                  onAuthorTap={() => {}}
                />
              ))}
            </div>
          )
        )}

        {/* Cards Sub Tab */}
        {subTab === 'cards' && (
          likedCardsLoading ? (
            <div className="flex justify-center pt-16">
              <div className="w-8 h-8 rounded-full border border-brand-brown/20 flex items-center justify-center animate-pulse">
                <span className="font-serif text-brand-brown/40 text-sm">F</span>
              </div>
            </div>
          ) : likedCards.length === 0 ? (
            <p className="text-center text-brand-brown/30 text-[11px] font-serif italic pt-12">No liked cards</p>
          ) : (
            <>
              <div className="flex flex-col items-center mb-4">
                <span className="font-sans text-brand-brown/30 text-[8px] tracking-[0.3em] uppercase">
                  {likedCards.length} Liked
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 px-4 pb-24">
                {likedCards.map((card, i) => {
                  const uiCard = toUICard(card, i);
                  return (
                    <motion.div
                      key={card.card_id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-[240px] relative overflow-hidden rounded-lg cursor-pointer"
                      onClick={() => onCardTap?.({ ...card, docId: card.card_id } as InventoryCard)}
                    >
                      <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.6)' }}>
                        <Card card={uiCard} isRevealed={true} compact />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )
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
