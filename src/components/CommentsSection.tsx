import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Flag, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  UserCircle2, 
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';
import { PollComment } from '../types/poll.ts';
import { fetchPollComments, addPollComment, reportComment } from '../utils/api.ts';
import { formatRelativeTime } from '../utils/fingerprint.ts';

interface CommentsSectionProps {
  pollId: string;
  onCommentCountChange?: (newCount: number) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  pollId,
  onCommentCountChange
}) => {
  const [comments, setComments] = useState<PollComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reportedCommentIds, setReportedCommentIds] = useState<Set<string>>(new Set());
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchPollComments(pollId)
      .then((data) => {
        if (isMounted) {
          setComments(data.comments);
          if (onCommentCountChange) {
            onCommentCountChange(data.comments.length);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load comments:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pollId]);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [comments, sortOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await addPollComment(pollId, commentText.trim(), authorName.trim() || undefined);
      const updated = [res.comment, ...comments];
      setComments(updated);
      setCommentText('');
      if (onCommentCountChange) {
        onCommentCountChange(updated.length);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (reportedCommentIds.has(commentId) || reportingId === commentId) return;
    setReportingId(commentId);

    try {
      await reportComment(commentId, 'Inappropriate or harmful community comment');
      setReportedCommentIds(prev => new Set(prev).add(commentId));
    } catch (err: any) {
      console.error('Failed to report comment:', err);
    } finally {
      setReportingId(null);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#2C2C40] space-y-4">
      {/* Header with Sorting Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#9B7BFF]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Community Discussion ({comments.length})
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {comments.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#101018] border border-[#2C2C40] hover:border-[#9B7BFF]/50 rounded-lg px-2.5 py-1 text-[11px] transition-colors">
              <ArrowUpDown className="w-3 h-3 text-[#9B7BFF]" />
              <label htmlFor={`sort-comments-${pollId}`} className="text-[#6C6C82] font-medium hidden xs:inline">
                Sort:
              </label>
              <select
                id={`sort-comments-${pollId}`}
                aria-label="Sort comments"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-[11px]"
              >
                <option value="newest" className="bg-[#1D1D2B] text-white">Newest</option>
                <option value="oldest" className="bg-[#1D1D2B] text-white">Oldest</option>
              </select>
            </div>
          )}
          <span className="text-[11px] text-[#9E9EB6] hidden sm:inline">No account required</span>
        </div>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5 bg-[#161622] p-3 rounded-xl border border-[#252538]">
        {error && (
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Nickname (optional)"
            maxLength={30}
            className="w-1/3 bg-[#101018] border border-[#2C2C40] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#6C6C82] focus:outline-none focus:border-[#9B7BFF]"
          />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add your twist or opinion..."
            maxLength={500}
            className="flex-1 bg-[#101018] border border-[#2C2C40] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#6C6C82] focus:outline-none focus:border-[#9B7BFF]"
            required
          />
          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="px-3.5 py-1.5 rounded-lg bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 shrink-0"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span className="hidden xs:inline">Post</span>
              </>
            )}
          </button>
        </div>
        <div className="flex justify-between items-center text-[10px] text-[#6C6C82] px-1">
          <span>Be civil and constructive.</span>
          <span>{commentText.length}/500</span>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#9E9EB6]">
          <Loader2 className="w-4 h-4 animate-spin text-[#9B7BFF]" />
          <span>Loading discussion...</span>
        </div>
      ) : sortedComments.length > 0 ? (
        <div className="relative overflow-hidden transition-all duration-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={sortOrder}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2.5 max-h-72 overflow-y-auto pr-1"
            >
              {sortedComments.map((com, index) => {
                const isReported = reportedCommentIds.has(com.id);
                return (
                  <motion.div 
                    key={com.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.2, 
                      delay: Math.min(index * 0.025, 0.12),
                      ease: 'easeOut'
                    }}
                    className="p-3 bg-[#161622]/80 border border-[#252538] rounded-xl text-xs space-y-1.5 group hover:border-[#3E3E58] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <UserCircle2 className="w-3.5 h-3.5 text-[#9B7BFF]" />
                        <span className="font-semibold text-white">
                          {com.authorName}
                        </span>
                        <span className="text-[#6C6C82] text-[10px]">
                          • {formatRelativeTime(com.createdAt)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleReportComment(com.id)}
                        disabled={isReported || reportingId === com.id}
                        title={isReported ? 'Reported' : 'Report comment'}
                        className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                          isReported 
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-[#6C6C82] hover:text-rose-400 hover:bg-rose-500/10'
                        }`}
                      >
                        {isReported ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Reported</span>
                          </>
                        ) : reportingId === com.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Flag className="w-3 h-3" />
                            <span className="hidden group-hover:inline">Report</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[#E2E2F0] leading-relaxed break-words pl-5">
                      {com.commentText}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-[#9E9EB6]">
          No comments yet. Be the first to share your perspective!
        </div>
      )}
    </div>
  );
};
