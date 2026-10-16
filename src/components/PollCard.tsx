import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Share2, 
  Flag, 
  Clock, 
  Users, 
  Sparkles, 
  Heart, 
  MessageSquare, 
  HelpCircle,
  Loader2,
  Check,
  Maximize2,
  X
} from 'lucide-react';
import { Poll } from '../types/poll.ts';
import { formatRelativeTime } from '../utils/fingerprint.ts';
import { castVote, togglePollLike } from '../utils/api.ts';
import { CommentsSection } from './CommentsSection.tsx';

interface PollCardProps {
  poll: Poll;
  onPollUpdated: (updatedPoll: Poll) => void;
  onShare: (poll: Poll) => void;
  onReport: (poll: Poll) => void;
  onOpenDisclaimer: () => void;
  highlightId?: string;
  defaultShowComments?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  onPollUpdated,
  onShare,
  onReport,
  onOpenDisclaimer,
  highlightId,
  defaultShowComments = false
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const isHighlighted = highlightId === poll.id || highlightId === poll.slug;

  const handleVote = async (optionId: string) => {
    if (poll.hasVoted || isVoting) return;

    setSelectedOptionId(optionId);
    setIsVoting(true);
    setVoteError(null);

    try {
      const res = await castVote(poll.id, optionId);
      onPollUpdated(res.poll);
    } catch (err: any) {
      if (err.alreadyVoted) {
        setVoteError('You have already voted on this poll from this browser.');
        onPollUpdated({
          ...poll,
          hasVoted: true,
          userVotedOptionId: err.userVotedOptionId || optionId
        });
      } else {
        setVoteError(err.message || 'Failed to submit vote. Please try again.');
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const res = await togglePollLike(poll.id);
      onPollUpdated({
        ...poll,
        hasLiked: res.liked,
        likeCount: res.likeCount
      });
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <>
      <article 
        id={`poll-${poll.id}`}
        className={`relative w-full bg-[#1D1D2B] border rounded-2xl p-5 sm:p-6 transition-all duration-200 ${
          isHighlighted
            ? 'border-[#9B7BFF] glow-purple'
            : 'border-[#2C2C40] hover:border-[#3E3E58]'
        }`}
      >
        {/* Top Meta Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {/* Category Tag */}
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#101018] text-[#9B7BFF] border border-[#2C2C40]">
              {poll.category}
            </span>

            {/* Clear label for community polls vs demo content */}
            {poll.isSample ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Demo Poll</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Community</span>
              </span>
            )}

            {poll.isVerifiedOrg && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#9B7BFF]/20 text-[#B9A1FF]">
                Verified
              </span>
            )}
          </div>

          {/* Date and Total Votes Header stats */}
          <div className="flex items-center gap-3 text-xs text-[#9E9EB6]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#6C6C82]" />
              <span>{formatRelativeTime(poll.createdAt)}</span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-white">
              <Users className="w-3.5 h-3.5 text-[#9B7BFF]" />
              <span>{poll.totalVotes.toLocaleString()} {poll.totalVotes === 1 ? 'vote' : 'votes'}</span>
            </span>
          </div>
        </div>

        {/* Poll Question */}
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug mb-2">
          {poll.question}
        </h2>

        {/* Description / Context if provided */}
        {poll.description && (
          <p className="text-xs sm:text-sm text-[#9E9EB6] mb-4 leading-relaxed line-clamp-3">
            {poll.description}
          </p>
        )}

        {/* Optional Attached Image */}
        {poll.imageUrl && (
          <div className="my-3.5 relative overflow-hidden rounded-xl border border-[#2C2C40] bg-[#101018] group">
            <img
              src={poll.imageUrl}
              alt={poll.question}
              loading="lazy"
              className="w-full max-h-72 object-cover object-center cursor-pointer transition-transform duration-300 group-hover:scale-102"
              onClick={() => setIsImageZoomed(true)}
            />
            <button
              onClick={() => setIsImageZoomed(true)}
              className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Expand image"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error alert if vote failed */}
        {voteError && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {voteError}
          </div>
        )}

        {/* Options List */}
        <div className="space-y-2.5 my-4">
          {poll.options.map((option) => {
            const isUserChoice = poll.userVotedOptionId === option.id;
            const isPending = isVoting && selectedOptionId === option.id;

            if (poll.hasVoted) {
              // After Voting View: Results with Percentage Bars
              return (
                <div
                  key={option.id}
                  className={`relative overflow-hidden rounded-xl border p-3.5 transition-all ${
                    isUserChoice
                      ? 'border-[#9B7BFF] bg-[#161622] shadow-sm shadow-[#9B7BFF]/20'
                      : 'border-[#2C2C40] bg-[#161622]/60'
                  }`}
                >
                  {/* Visual Progress Bar Fill */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out rounded-xl ${
                      isUserChoice
                        ? 'bg-gradient-to-r from-[#9B7BFF]/30 to-[#7B55F5]/40'
                        : 'bg-[#252538]/70'
                    }`}
                    style={{ width: `${Math.max(option.percentage, option.voteCount > 0 ? 3 : 0)}%` }}
                  />

                  {/* Content over progress bar */}
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {isUserChoice ? (
                        <div className="w-5 h-5 rounded-full bg-[#9B7BFF] text-[#101018] flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[#3E3E58] bg-[#101018]/50 shrink-0" />
                      )}
                      <span className={`text-xs sm:text-sm font-medium truncate ${
                        isUserChoice ? 'text-white font-semibold' : 'text-[#E2E2F0]'
                      }`}>
                        {option.text}
                      </span>
                      {isUserChoice && (
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-[#9B7BFF]/20 text-[#B9A1FF] border border-[#9B7BFF]/30 shrink-0">
                          Your Twist
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {option.percentage}%
                      </span>
                      <span className="text-[10px] text-[#9E9EB6] block">
                        {option.voteCount.toLocaleString()} {option.voteCount === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Before Voting View: Interactive Buttons
            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={isVoting}
                className={`w-full group relative flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-150 ${
                  isPending
                    ? 'bg-[#9B7BFF]/15 border-[#9B7BFF]'
                    : 'bg-[#161622] hover:bg-[#252538] border-[#2C2C40] hover:border-[#9B7BFF]/60 hover:shadow-md hover:shadow-[#9B7BFF]/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 rounded-full border-2 border-[#3E3E58] group-hover:border-[#9B7BFF] flex items-center justify-center transition-colors shrink-0">
                    <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[#9B7BFF] transition-colors" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-white group-hover:text-[#B9A1FF] transition-colors">
                    {option.text}
                  </span>
                </div>

                {isPending && (
                  <Loader2 className="w-4 h-4 text-[#9B7BFF] animate-spin shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-[#2C2C40] flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Real Like Button */}
            <button
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                poll.hasLiked 
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                  : 'text-[#9E9EB6] hover:text-white hover:bg-[#252538]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                poll.hasLiked ? 'fill-rose-400 text-rose-400' : 'text-[#9E9EB6]'
              }`} />
              <span>{poll.likeCount > 0 ? poll.likeCount : 'Like'}</span>
            </button>

            {/* Real Comments Toggle */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                showComments
                  ? 'bg-[#9B7BFF]/15 text-[#B9A1FF] border border-[#9B7BFF]/25'
                  : 'text-[#9E9EB6] hover:text-white hover:bg-[#252538]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#9B7BFF]" />
              <span>{poll.commentCount > 0 ? poll.commentCount : 'Discuss'}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => onShare(poll)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#9E9EB6] hover:text-white hover:bg-[#252538] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-[#9B7BFF]" />
              <span className="hidden xs:inline">Share</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Duplicate protection info button */}
            <button
              onClick={onOpenDisclaimer}
              title="Duplicate voting protection details"
              className="text-[#6C6C82] hover:text-[#9E9EB6] p-1.5 rounded-lg hover:bg-[#252538] transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Report Button */}
            <button
              onClick={() => onReport(poll)}
              title="Report inappropriate poll"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-[#6C6C82] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Flag className="w-3 h-3" />
              <span className="hidden sm:inline">Report</span>
            </button>
          </div>
        </div>

        {/* Embedded Comments Section */}
        {showComments && (
          <CommentsSection
            pollId={poll.id}
            onCommentCountChange={(count) => {
              onPollUpdated({
                ...poll,
                commentCount: count
              });
            }}
          />
        )}
      </article>

      {/* Lightbox Image Zoom Modal */}
      {isImageZoomed && poll.imageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={poll.imageUrl}
              alt={poll.question}
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-[#2C2C40] shadow-2xl"
            />
            <button
              onClick={() => setIsImageZoomed(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
