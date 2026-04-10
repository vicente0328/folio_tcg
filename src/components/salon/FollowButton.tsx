import { useState, useEffect } from 'react';
import { isFollowing, toggleFollow } from '../../lib/firestore';
import { useAuth } from '../../context/AuthContext';

interface FollowButtonProps {
  targetUid: string;
  targetName: string;
}

export default function FollowButton({ targetUid, targetName }: FollowButtonProps) {
  const { user, userProfile } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.uid === targetUid) return;
    isFollowing(user.uid, targetUid).then(v => { setFollowing(v); setLoading(false); });
  }, [user, targetUid]);

  if (!user || user.uid === targetUid) return null;

  const handleToggle = async () => {
    if (loading) return;
    const prev = following;
    setFollowing(!prev); // optimistic
    try {
      await toggleFollow(user.uid, userProfile?.displayName || 'User', targetUid, targetName);
    } catch {
      setFollowing(prev); // revert
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-5 py-1.5 rounded-sm text-[9px] tracking-[0.15em] uppercase font-medium transition-colors ${
        following
          ? 'border border-brand-brown/20 text-brand-brown/60 hover:border-brand-brown/40'
          : 'bg-brand-brown text-brand-cream hover:bg-brand-brown/90'
      }`}
    >
      {loading ? '...' : following ? 'Following' : 'Follow'}
    </button>
  );
}
