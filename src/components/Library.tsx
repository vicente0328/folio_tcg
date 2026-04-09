import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import ProfileHeader from './library/ProfileHeader';
import FeaturedCollection from './library/FeaturedCollection';
import CardGrid from './library/CardGrid';
import CollectionEditor from './library/CollectionEditor';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { getCollectionLikes, getUserCollection } from '../lib/firestore';

export default function Library() {
  const { user, userProfile } = useAuth();
  const { inventory } = useGame();
  const [showEditor, setShowEditor] = useState(false);
  const [collectionRefreshKey, setCollectionRefreshKey] = useState(0);
  const [collectionLikes, setCollectionLikes] = useState(0);

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

      {/* Collection Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <CollectionEditor
            onClose={() => setShowEditor(false)}
            onSaved={handleCollectionSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
