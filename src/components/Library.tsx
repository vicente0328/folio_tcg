import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import ProfileHeader from './library/ProfileHeader';
import FeaturedCollection from './library/FeaturedCollection';
import CardGrid from './library/CardGrid';
import CollectionEditor from './library/CollectionEditor';
import FollowListOverlay from './salon/FollowListOverlay';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { getCollectionLikes, getUserCollection, getFollowers, getFollowing } from '../lib/firestore';

export default function Library() {
  const { user, userProfile } = useAuth();
  const { inventory } = useGame();
  const [showEditor, setShowEditor] = useState(false);
  const [collectionRefreshKey, setCollectionRefreshKey] = useState(0);
  const [collectionLikes, setCollectionLikes] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followListMode, setFollowListMode] = useState<'followers' | 'following' | null>(null);

  // Fetch collection likes count for profile header
  useEffect(() => {
    if (!user) return;
    getUserCollection(user.uid).then((col) => {
      if (col) {
        getCollectionLikes(col.id).then((likes) => setCollectionLikes(likes.length));
      } else {
        setCollectionLikes(0);
      }
    });
    getFollowers(user.uid).then(f => setFollowerCount(f.length));
    getFollowing(user.uid).then(f => setFollowingCount(f.length));
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
        collectionLikes={collectionLikes}
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

      {/* Card Grid (search, filter, cards, overlays) */}
      <CardGrid inventory={inventory} />

      {/* Collection Editor Modal — portal to body to escape stacking context */}
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
