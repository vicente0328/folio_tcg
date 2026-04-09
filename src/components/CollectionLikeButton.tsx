import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleCollectionLike, getCollectionLikes, type CollectionLike } from '../lib/firestore';

interface CollectionLikeButtonProps {
  collectionId: string;
}

export default function CollectionLikeButton({ collectionId }: CollectionLikeButtonProps) {
  const { user, userProfile } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState<CollectionLike[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!collectionId) return;
    getCollectionLikes(collectionId).then((data) => {
      setLikes(data);
      if (user) {
        setLiked(data.some(l => l.uid === user.uid));
      }
    });
  }, [collectionId, user]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !userProfile) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    if (wasLiked) {
      setLikes(prev => prev.filter(l => l.uid !== user.uid));
    } else {
      setLikes(prev => [...prev, { uid: user.uid, displayName: userProfile.displayName, likedAt: new Date().toISOString() }]);
    }

    try {
      await toggleCollectionLike(collectionId, user.uid, userProfile.displayName);
    } catch {
      setLiked(wasLiked);
      const fresh = await getCollectionLikes(collectionId);
      setLikes(fresh);
    }
  };

  const handleCountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likes.length > 0) setShowModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <motion.button onClick={handleToggle} className="relative" whileTap={{ scale: 0.85 }}>
          <motion.div
            animate={animating && liked ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Heart
              size={20}
              strokeWidth={1.5}
              className={`transition-colors duration-200 ${liked ? 'fill-red-400 text-red-400' : 'text-brand-brown/40 hover:text-red-300'}`}
            />
          </motion.div>
          <AnimatePresence>
            {animating && liked && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <Heart size={20} strokeWidth={1.5} className="fill-red-300 text-red-300" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <button
          onClick={handleCountClick}
          className={`text-[10px] tracking-wide transition-colors ${likes.length > 0 ? 'text-brand-brown/60 hover:text-brand-brown cursor-pointer' : 'text-brand-brown/30 cursor-default'}`}
        >
          {likes.length > 0
            ? `${likes.length} ${likes.length === 1 ? 'like' : 'likes'}`
            : 'Be the first to like'}
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-brand-cream border border-brand-brown/15 rounded-lg w-72 max-h-80 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-brown/10">
                <span className="font-serif text-brand-brown text-sm tracking-wide">Likes</span>
                <button onClick={() => setShowModal(false)} className="text-brand-brown/40 hover:text-brand-brown transition-colors">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {likes.map((like) => (
                  <div key={like.uid} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-brown/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-serif text-brand-brown/50 text-xs">{like.displayName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-brand-brown text-[12px] font-medium tracking-wide truncate">{like.displayName}</span>
                    <Heart size={12} className="fill-red-400 text-red-400 flex-shrink-0 ml-auto" />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
