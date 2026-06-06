import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { postsApi } from '../api/endpoints';
import DataState from '../components/DataState';
import { useUIStore } from '../stores/uiStore';

export default function CirclePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsApi.getPosts(p);
      const data = res.data;
      setPosts(p === 1 ? data.posts : [...posts, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(p);
    } catch {
      setError('加载动态失败');
    }
    setLoading(false);
  };

  const publish = async () => {
    if (!content.trim()) return;
    try {
      await postsApi.createPost(content);
      setContent('');
      showToast('动态已发表 ✨', 'success');
      loadPosts(1);
    } catch {
      showToast('发表失败', 'error');
    }
  };

  const toggleLike = async (postId: string) => {
    try { await postsApi.toggleLike(postId); loadPosts(page); }
    catch { showToast('操作失败', 'error'); }
  };

  const removePost = async (postId: string) => {
    try { await postsApi.deletePost(postId); loadPosts(1); }
    catch { showToast('删除失败', 'error'); }
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-4">✨ 魔法圈</h1>

      <div className="card mb-4">
        <textarea
          className="w-full bg-transparent border border-gold/20 rounded-lg p-3 text-parchment placeholder:text-parchment/30 text-sm resize-none focus:outline-none focus:border-gold/50"
          rows={3}
          placeholder="分享你的魔法时刻...（使用 @ 提及好友）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-parchment/20 text-xs">支持图片上传（即将开放）</span>
          <button className="btn-primary text-sm py-1.5" onClick={publish} disabled={!content.trim()}>
            ✨ 发表
          </button>
        </div>
      </div>

      <DataState loading={loading} error={error} onRetry={() => loadPosts(1)} isEmpty={!loading && posts.length === 0} emptyMsg="暂时没有动态" emptyIcon="🦉">
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={toggleLike} onDelete={removePost} />
          ))}
          {hasMore && (
            <button className="btn-ghost w-full text-sm" onClick={() => loadPosts(page + 1)} disabled={loading}>
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      </DataState>
    </div>
  );
}

function PostCard({ post, onLike, onDelete }: { post: any; onLike: (id: string) => void; onDelete: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const showToast = useUIStore((s) => s.showToast);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await postsApi.getComments(post.id);
      setComments(res.data.comments || res.data || []);
    } catch {
      showToast('加载评论失败', 'error');
    }
    setCommentsLoading(false);
  };

  const toggleComments = () => {
    if (!showComments) {
      setShowComments(true);
      if (comments.length === 0) loadComments();
    } else {
      setShowComments(false);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      await postsApi.addComment(post.id, commentText.trim());
      setCommentText('');
      showToast('评论成功 💬', 'success');
      loadComments();
    } catch {
      showToast('评论失败', 'error');
    }
    setSendingComment(false);
  };

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-sm border border-gold/30">
            🧙
          </div>
          <span className="text-sm text-parchment/70">巫师</span>
        </div>
        <button className="text-parchment/20 hover:text-red-400 text-xs" onClick={() => onDelete(post.id)}>
          ✕
        </button>
      </div>
      <p className="text-sm leading-relaxed">{post.content}</p>
      <div className="flex items-center gap-4 mt-3 text-xs text-parchment/40">
        <button className="hover:text-gold transition-colors" onClick={() => onLike(post.id)}>
          ❤ {post._count?.likes || 0}
        </button>
        <button className="hover:text-gold transition-colors" onClick={toggleComments}>
          💬 {post._count?.comments || 0}{showComments ? ' ▲' : ' ▼'}
        </button>
      </div>

      {showComments && (
        <motion.div className="mt-3 pt-3 border-t border-gold/10" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {commentsLoading ? (
              <p className="text-parchment/20 text-xs text-center py-2">加载中...</p>
            ) : comments.length === 0 ? (
              <p className="text-parchment/20 text-xs text-center py-2">还没有评论</p>
            ) : (
              comments.map((c: any) => (
                <div key={c.id} className="flex gap-2 text-xs">
                  <span className="text-gold/60 flex-shrink-0">🧙</span>
                  <div>
                    <span className="text-parchment/60">{c.content}</span>
                    <p className="text-parchment/20">{new Date(c.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-1.5 bg-black/40 border border-gold/20 rounded text-parchment placeholder:text-parchment/20 text-xs focus:outline-none focus:border-gold/50"
              placeholder="写下你的评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
              disabled={sendingComment}
            />
            <button
              className="px-3 py-1.5 bg-gold/60 hover:bg-gold text-black text-xs rounded transition-colors disabled:opacity-50"
              onClick={addComment}
              disabled={!commentText.trim() || sendingComment}
            >
              {sendingComment ? '...' : '发表'}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
