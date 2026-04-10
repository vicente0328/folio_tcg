import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { getFollowers, getFollowing, type Follow } from '../../lib/firestore';
import FollowButton from './FollowButton';

interface FollowListOverlayProps {
  userId: string;
  mode: 'followers' | 'following';
  onClose: () => void;
}

export default function FollowListOverlay({ userId, mode, onClose }: FollowListOverlayProps) {
  const [list, setList] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = mode === 'followers' ? getFollowers : getFollowing;
    fetch(userId).then(data => { setList(data); setLoading(false); });
  }, [userId, mode]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-brand-cream w-full max-w-md rounded-t-xl max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-brown/10">
          <h3 className="font-serif text-brand-brown text-sm tracking-[0.15em]">
            {mode === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <button onClick={onClose} className="text-brand-brown/40 hover:text-brand-brown transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border border-brand-brown/20 flex items-center justify-center animate-pulse">
                <span className="font-serif text-brand-brown/40 text-sm">F</span>
              </div>
            </div>
          ) : list.length === 0 ? (
            <p className="text-center text-brand-brown/30 text-[11px] font-serif italic py-12">
              {mode === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </p>
          ) : (
            <div className="space-y-1">
              {list.map(f => {
                const uid = mode === 'followers' ? f.followerId : f.followedId;
                const name = mode === 'followers' ? f.followerName : f.followedName;
                return (
                  <div key={uid} className="flex items-center justify-between py-3 border-b border-brand-brown/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full border border-brand-brown/15 flex items-center justify-center">
                        <span className="font-serif text-brand-brown/50 text-sm">{name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-[11px] text-brand-brown tracking-wide">{name}</span>
                    </div>
                    <FollowButton targetUid={uid} targetName={name} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
