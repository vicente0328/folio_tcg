import { MessageCircle } from 'lucide-react';
import PostLikeButton from './PostLikeButton';
import PostCardCarousel from './PostCardCarousel';
import FollowButton from './FollowButton';
import { type Post } from '../../lib/firestore';
import { type CardData } from '../../data/cards';

interface PostCardProps {
  post: Post;
  onTap: () => void;
  onCardTap?: (card: CardData, index: number) => void;
  onAuthorTap?: (uid: string, name: string) => void;
}

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d`;
  return date.toLocaleDateString();
}

export default function PostCard({ post, onTap, onCardTap, onAuthorTap }: PostCardProps) {
  return (
    <div
      className={`px-5 py-4 border-b border-brand-brown/8 ${post.isAdminQuestion ? 'border-l-2 border-l-brand-orange' : ''}`}
    >
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <button
          onClick={() => onAuthorTap?.(post.authorUid, post.authorName)}
          className="w-8 h-8 rounded-full border border-brand-brown/15 flex items-center justify-center shrink-0"
        >
          <span className="font-serif text-brand-brown/50 text-sm">{post.authorName.charAt(0).toUpperCase()}</span>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAuthorTap?.(post.authorUid, post.authorName)}
              className="text-[11px] text-brand-brown font-medium tracking-wide truncate hover:text-brand-orange transition-colors"
            >
              {post.authorName}
            </button>
            <span className="text-[9px] text-brand-brown/30">{timeAgo(post.createdAt)}</span>
          </div>
          {post.isAdminQuestion && (
            <span className="text-[8px] tracking-[0.15em] uppercase text-brand-orange font-medium">Admin Question</span>
          )}
        </div>
        <FollowButton targetUid={post.authorUid} targetName={post.authorName} />
      </div>

      {/* Text */}
      <p className="text-[12px] text-brand-brown/80 leading-relaxed mb-2 whitespace-pre-wrap">{post.text}</p>

      {/* Cards */}
      {post.cards.length > 0 && (
        <PostCardCarousel cards={post.cards} onCardTap={onCardTap} />
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 mt-2">
        <PostLikeButton postId={post.id} likeCount={post.likeCount} />
        <button onClick={onTap} className="flex items-center gap-1.5 text-brand-brown/40 hover:text-brand-brown/60 transition-colors">
          <MessageCircle size={16} strokeWidth={1.5} />
          <span className="text-[11px]">{post.commentCount > 0 ? post.commentCount : ''}</span>
        </button>
      </div>
    </div>
  );
}
