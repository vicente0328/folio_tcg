import { useState, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import SalonTab from './salon/SalonTab';
import PostComposer from './salon/PostComposer';
import PostDetail from './salon/PostDetail';
import SalonCardPreview from './salon/SalonCardPreview';
import { type Post } from '../lib/firestore';
import { type CardData } from '../data/cards';

export default function Salon() {
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [previewCard, setPreviewCard] = useState<{ card: CardData; ownerUid: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePosted = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleCardTap = useCallback((card: CardData, ownerUid: string) => {
    setPreviewCard({ card, ownerUid });
  }, []);

  return (
    <>
      <SalonTab
        key={refreshKey}
        onCompose={() => setShowComposer(true)}
        onPostTap={(post) => setSelectedPost(post)}
        onCardTap={handleCardTap}
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
          />
        )}
      </AnimatePresence>
    </>
  );
}
