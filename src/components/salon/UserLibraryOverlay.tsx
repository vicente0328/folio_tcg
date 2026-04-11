import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';
import ProfileHeader from '../library/ProfileHeader';
import FeaturedCollection from '../library/FeaturedCollection';
import FollowButton from './FollowButton';
import FollowListOverlay from './FollowListOverlay';
import PostCard from './PostCard';
import Card from '../Card';
import LikeButton from '../LikeButton';
import BookDetail from '../BookDetail';
import { toUICard, type UICard } from '../../lib/cardAdapter';
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
  const [focusedCard, setFocusedCard] = useState<{ uiCard: UICard; inv: InventoryCard } | null>(null);
  const [flippedInFocus, setFlippedInFocus] = useState(false);
  const [showBookDetail, setShowBookDetail] = useState(false);
  const isSelf = user?.uid === uid;

  useEffect(() => {
    getUserInventoryWithIds(uid).then(inv => { setInventory(inv); setLoading(false); });
    getFollowers(uid).then(f => setFollowerCount(f.length));
    getFollowing(uid).then(f => setFollowingCount(f.length));
    getPostsByUser(uid).then(p => { setPosts(p); setPostsLoading(false); }).catch(() => setPostsLoading(false));
    getLikedCards(uid).then(c => { setLikedCards(c); setLikedCardsLoading(false); }).catch(() => setLikedCardsLoading(false));
  }, [uid]);

  const likedCardIds = useMemo(() => new Set(likedCards.map(c => c.card_id)), [likedCards]);

  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => {
      const aLiked = likedCardIds.has(a.card_id) ? 0 : 1;
      const bLiked = likedCardIds.has(b.card_id) ? 0 : 1;
      return aLiked - bLiked;
    });
  }, [inventory, likedCardIds]);

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
              {tab === 'posts' ? 'Posts' : 'Cards'}
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
          loading ? (
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
                <span className="font-sans text-brand-brown/30 text-[8px] tracking-[0.3em] uppercase">
                  {inventory.length} Cards
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 px-4 pb-24">
                {sortedInventory.map((card, i) => {
                  const uiCard = toUICard(card, i);
                  const isLiked = likedCardIds.has(card.card_id);
                  return (
                    <motion.div
                      key={card.docId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-[240px] relative overflow-hidden rounded-lg cursor-pointer"
                      onClick={() => { setFlippedInFocus(false); setFocusedCard({ uiCard, inv: card }); }}
                    >
                      <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.6)' }}>
                        <Card card={uiCard} isRevealed={true} compact />
                      </div>
                      {isLiked && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-orange/80 flex items-center justify-center">
                          <span className="text-white text-[8px]">&#9829;</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>

      {/* Focused Card Overlay */}
      {focusedCard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute inset-0 bg-brand-cream/[0.98] z-[10] flex flex-col items-center justify-center"
          onClick={() => { setFocusedCard(null); setFlippedInFocus(false); }}
        >
          <motion.div
            className="relative cursor-pointer mt-[15px]"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 0.8 }}
            onClick={(e) => { e.stopPropagation(); setFlippedInFocus(prev => !prev); }}
          >
            <Card
              card={focusedCard.uiCard}
              isRevealed={true}
              isFlipped={flippedInFocus}
            />
            <motion.button
              onClick={(e) => { e.stopPropagation(); setFocusedCard(null); setFlippedInFocus(false); }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -top-5 -right-5 z-10 w-8 h-8 rounded-full bg-brand-cream border border-brand-brown/20 flex items-center justify-center text-brand-brown/40 hover:text-brand-brown hover:border-brand-brown/40 transition-colors shadow-sm"
            >
              <X size={15} strokeWidth={1.5} />
            </motion.button>
          </motion.div>

          <div className="flex flex-col items-center" style={{ minHeight: 100 }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-5"
              onClick={(e) => e.stopPropagation()}
            >
              <LikeButton cardId={focusedCard.uiCard.cardId} />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="mt-4 font-sans text-brand-brown/40 text-[9px] tracking-[0.2em] uppercase"
            >
              {flippedInFocus ? 'Tap to see front' : 'Tap to read Between the Lines'}
            </motion.span>

            <motion.button
              animate={{ opacity: flippedInFocus ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => { e.stopPropagation(); if (flippedInFocus) setShowBookDetail(true); }}
              className="mt-3 font-serif text-[10px] tracking-[0.15em] text-brand-brown/55 border-b border-brand-brown/20 hover:text-brand-brown hover:border-brand-brown/40 transition-colors pb-0.5"
              style={{ pointerEvents: flippedInFocus ? 'auto' : 'none' }}
            >
              줄거리 더 알아보기
            </motion.button>

            {/* Propose Trade button (only for other users' cards) */}
            {!isSelf && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedCard(null);
                  setFlippedInFocus(false);
                  onCardTap?.(focusedCard.inv);
                }}
                className="mt-4 px-5 py-2 rounded-sm bg-brand-brown text-brand-cream text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-brand-brown/90 transition-colors"
              >
                Propose Trade
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Book Detail Overlay */}
      <AnimatePresence>
        {showBookDetail && focusedCard && (
          <BookDetail
            bookTitle={focusedCard.uiCard.work}
            onClose={() => setShowBookDetail(false)}
          />
        )}
      </AnimatePresence>

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
