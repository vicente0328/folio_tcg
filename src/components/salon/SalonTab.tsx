import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import PostCard from './PostCard';
import { getPosts, type Post } from '../../lib/firestore';
import { type CardData } from '../../data/cards';

interface SalonTabProps {
  onCompose: () => void;
  onPostTap: (post: Post) => void;
  onCardTap: (card: CardData, ownerUid: string) => void;
}

export default function SalonTab({ onCompose, onPostTap, onCardTap }: SalonTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const data = await getPosts(20);
    setPosts(data);
    setHasMore(data.length >= 20);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    const last = posts[posts.length - 1];
    const more = await getPosts(20, last.createdAt);
    setPosts(prev => [...prev, ...more]);
    setHasMore(more.length >= 20);
    setLoadingMore(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
      loadMore();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h2 className="font-serif text-brand-brown text-lg tracking-[0.2em]">Salon</h2>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar" onScroll={handleScroll}>
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-10 h-10 rounded-full border border-brand-brown/20 flex items-center justify-center animate-pulse">
              <span className="font-serif text-brand-brown/40 text-base">F</span>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 px-8">
            <p className="text-brand-brown/30 text-[11px] font-serif italic text-center leading-relaxed">
              No posts yet. Be the first to share your thoughts on literature.
            </p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onTap={() => onPostTap(post)}
                onCardTap={(card) => onCardTap(card, post.authorUid)}
              />
            ))}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin text-brand-brown/30" />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-brand-brown/20 text-[9px] tracking-[0.2em] uppercase py-6">End of feed</p>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={onCompose}
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-brand-brown text-brand-cream shadow-lg flex items-center justify-center hover:bg-brand-brown/90 transition-colors z-10"
      >
        <Plus size={22} strokeWidth={2} />
      </button>
    </div>
  );
}
