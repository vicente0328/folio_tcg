import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import PostCard from './PostCard';
import CommentItem from './CommentItem';
import CommentComposer from './CommentComposer';
import { getComments, deleteComment, deletePost, type Post, type PostComment } from '../../lib/firestore';
import { useAuth } from '../../context/AuthContext';
import { type CardData } from '../../data/cards';

interface PostDetailProps {
  post: Post;
  onClose: () => void;
  onDeleted: () => void;
  onCardTap: (card: CardData, ownerUid: string) => void;
}

export default function PostDetail({ post, onClose, onDeleted, onCardTap }: PostDetailProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwner = user?.uid === post.authorUid;

  const fetchComments = async () => {
    const data = await getComments(post.id);
    setComments(data);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [post.id]);

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    setComments(prev => prev.filter(c => c.id !== commentId));
    await deleteComment(post.id, commentId, user.uid);
  };

  const handleDeletePost = async () => {
    if (!user) return;
    await deletePost(post.id, user.uid);
    onDeleted();
    onClose();
  };

  return createPortal(
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[150] bg-brand-cream flex flex-col max-w-md mx-auto"
      style={{ height: '100dvh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3 border-b border-brand-brown/10 flex-shrink-0">
        <button onClick={onClose} className="text-brand-brown/40 hover:text-brand-brown transition-colors">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <h3 className="font-serif text-brand-brown text-sm tracking-[0.15em]">Post</h3>
        {isOwner ? (
          <button onClick={handleDeletePost} className="text-brand-brown/30 hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        ) : <div className="w-4" />}
      </div>

      {/* Post + Comments */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <PostCard
          post={post}
          onTap={() => {}}
          onCardTap={(card) => onCardTap(card, post.authorUid)}
        />

        <div className="px-5 py-2">
          <div className="w-8 h-[1px] bg-brand-brown/10 mx-auto mb-1"></div>
          <p className="text-center text-[8px] tracking-[0.2em] uppercase text-brand-brown/25">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={16} className="animate-spin text-brand-brown/30" />
          </div>
        ) : (
          comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              onDelete={handleDeleteComment}
              onCardTap={(card) => onCardTap(card, c.authorUid)}
            />
          ))
        )}
      </div>

      {/* Comment composer */}
      <CommentComposer postId={post.id} onCommented={fetchComments} />
    </motion.div>,
    document.body
  );
}
