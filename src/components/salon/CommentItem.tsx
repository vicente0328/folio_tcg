import { Trash2 } from 'lucide-react';
import PostCardCarousel from './PostCardCarousel';
import { type PostComment } from '../../lib/firestore';
import { type CardData } from '../../data/cards';
import { useAuth } from '../../context/AuthContext';

interface CommentItemProps {
  comment: PostComment;
  onDelete: (commentId: string) => void;
  onCardTap?: (card: CardData) => void;
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

export default function CommentItem({ comment, onDelete, onCardTap }: CommentItemProps) {
  const { user } = useAuth();
  const isOwner = user?.uid === comment.authorUid;

  return (
    <div className="px-5 py-3 border-b border-brand-brown/5">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full border border-brand-brown/15 flex items-center justify-center shrink-0 mt-0.5">
          <span className="font-serif text-brand-brown/40 text-xs">{comment.authorName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-brand-brown font-medium tracking-wide">{comment.authorName}</span>
            <span className="text-[8px] text-brand-brown/25">{timeAgo(comment.createdAt)}</span>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                className="ml-auto text-brand-brown/20 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <p className="text-[11px] text-brand-brown/70 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
          {comment.cards.length > 0 && (
            <PostCardCarousel cards={comment.cards} onCardTap={(card) => onCardTap?.(card)} />
          )}
        </div>
      </div>
    </div>
  );
}
