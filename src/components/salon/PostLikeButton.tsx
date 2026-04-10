import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { togglePostLike, isPostLiked } from '../../lib/firestore';

interface PostLikeButtonProps {
  postId: string;
  likeCount: number;
}

export default function PostLikeButton({ postId, likeCount }: PostLikeButtonProps) {
  const { user, userProfile } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likeCount);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!user) return;
    isPostLiked(postId, user.uid).then(setLiked);
  }, [postId, user]);

  useEffect(() => { setCount(likeCount); }, [likeCount]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !userProfile) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount(c => wasLiked ? c - 1 : c + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    try {
      await togglePostLike(postId, user.uid, userProfile.displayName);
    } catch {
      setLiked(wasLiked);
      setCount(likeCount);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <motion.button onClick={handleToggle} whileTap={{ scale: 0.85 }} className="relative">
        <motion.div animate={animating && liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.35 }}>
          <Heart
            size={18}
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
              <Heart size={18} strokeWidth={1.5} className="fill-red-300 text-red-300" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      <span className="text-[11px] text-brand-brown/50">{count > 0 ? count : ''}</span>
    </div>
  );
}
