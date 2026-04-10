import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import ProfileHeader from './library/ProfileHeader';
import FeaturedCollection from './library/FeaturedCollection';
import CardGrid from './library/CardGrid';
import CollectionEditor from './library/CollectionEditor';
import FollowListOverlay from './salon/FollowListOverlay';
import PostCard from './salon/PostCard';
import PostDetail from './salon/PostDetail';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { getFollowers, getFollowing, getPostsByUser, getLikedCards, type Post } from '../lib/firestore';
import { type CardData } from '../data/cards';

type SubTab = 'posts' | 'cards';

export default function Library() {
  const { user, userProfile } = useAuth();
  const { inventory } = useGame();
  const [showEditor, setShowEditor] = useState(false);
  const [collectionRefreshKey, setCollectionRefreshKey] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followListMode, setFollowListMode] = useState<'followers' | 'following' | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('cards');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [likedCardIds, setLikedCardIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    getFollowers(user.uid).then(f => setFollowerCount(f.length));
    getFollowing(user.uid).then(f => setFollowingCount(f.length));
    getPostsByUser(user.uid).then(p => { setPosts(p); setPostsLoading(false); }).catch(() => setPostsLoading(false));
    getLikedCards(user.uid).then(c => setLikedCardIds(new Set(c.map(card => card.card_id)))).catch(() => {});
  }, [user, collectionRefreshKey]);

  const handleCollectionSaved = () => {
    setShowEditor(false);
    setCollectionRefreshKey(k => k + 1);
  };

  if (!user || !userProfile) return null;

  return (
    <div className="h-full flex flex-col overflow-y-auto no-scrollbar">
      {/* Profile Header */}
      <ProfileHeader
        displayName={userProfile.displayName}
        cardCount={inventory.length}
        followerCount={followerCount}
        followingCount={followingCount}
        onFollowersTap={() => setFollowListMode('followers')}
        onFollowingTap={() => setFollowListMode('following')}
      />

      {/* Featured Collection */}
      <FeaturedCollection
        uid={user.uid}
        isOwner={true}
        onEdit={() => setShowEditor(true)}
        refreshKey={collectionRefreshKey}
      />

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
                onTap={() => setSelectedPost(post)}
                onCardTap={() => {}}
                onAuthorTap={() => {}}
              />
            ))}
          </div>
        )
      )}

      {/* Cards Sub Tab */}
      {subTab === 'cards' && (
        <CardGrid inventory={inventory} likedCardIds={likedCardIds} />
      )}

      {/* Post Detail Overlay */}
      {createPortal(
        <AnimatePresence>
          {selectedPost && (
            <PostDetail
              post={selectedPost}
              onClose={() => setSelectedPost(null)}
              onDeleted={() => {
                setSelectedPost(null);
                if (user) getPostsByUser(user.uid).then(setPosts);
              }}
              onCardTap={() => {}}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Collection Editor Modal */}
      {createPortal(
        <AnimatePresence>
          {showEditor && (
            <CollectionEditor
              onClose={() => setShowEditor(false)}
              onSaved={handleCollectionSaved}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Follow List Overlay */}
      {createPortal(
        <AnimatePresence>
          {followListMode && (
            <FollowListOverlay
              userId={user.uid}
              mode={followListMode}
              onClose={() => setFollowListMode(null)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
