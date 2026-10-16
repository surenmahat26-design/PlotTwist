import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Clock, 
  PlusCircle, 
  ShieldCheck, 
  Search,
  HelpCircle
} from 'lucide-react';
import { Poll, PlatformStats, SortOption } from '../types/poll.ts';
import { PollCard } from './PollCard.tsx';
import { EmptyState } from './EmptyState.tsx';

interface CommunityViewProps {
  polls: Poll[];
  stats: PlatformStats | null;
  onPollUpdated: (poll: Poll) => void;
  onShare: (poll: Poll) => void;
  onReport: (poll: Poll) => void;
  onOpenDisclaimer: () => void;
  onCreatePoll: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  polls,
  stats,
  onPollUpdated,
  onShare,
  onReport,
  onOpenDisclaimer,
  onCreatePoll
}) => {
  const [filterType, setFilterType] = useState<'all' | 'discussed' | 'trending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter polls for community view
  let communityPolls = polls.filter(p => !p.isSample);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    communityPolls = communityPolls.filter(p => 
      p.question.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  if (filterType === 'discussed') {
    communityPolls = [...communityPolls].sort((a, b) => b.commentCount - a.commentCount);
  } else if (filterType === 'trending') {
    communityPolls = [...communityPolls].sort((a, b) => (b.totalVotes + b.likeCount * 2 + b.commentCount * 3) - (a.totalVotes + a.likeCount * 2 + a.commentCount * 3));
  } else {
    communityPolls = [...communityPolls].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <div className="w-full space-y-6 pb-16 sm:pb-8">
      {/* Community Banner */}
      <div className="bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#7B55F5]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9B7BFF]/15 border border-[#9B7BFF]/25 text-[#B9A1FF] text-xs font-semibold">
              <Users className="w-3.5 h-3.5 text-[#9B7BFF]" />
              <span>Login-Free Community</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Public Discussion & <span className="text-[#9B7BFF]">Debates</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#9E9EB6] leading-relaxed">
              Every poll is created by real community members. Vote, like, and share your perspective in discussions — completely registration-free.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onCreatePoll}
              className="px-5 py-3 rounded-xl bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-[#9B7BFF]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Post a Poll</span>
            </button>
            <button
              onClick={onOpenDisclaimer}
              className="px-3.5 py-3 rounded-xl bg-[#161622] hover:bg-[#252538] border border-[#2C2C40] text-xs font-semibold text-[#9E9EB6] hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anonymous Integrity</span>
            </button>
          </div>
        </div>

        {/* Real Community Metric Badges */}
        <div className="mt-6 pt-5 border-t border-[#2C2C40] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
          <div className="bg-[#161622]/60 p-3 rounded-xl border border-[#252538]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E9EB6] block">
              Community Polls
            </span>
            <span className="text-base sm:text-lg font-black text-white">
              {stats?.communityPolls ?? communityPolls.length}
            </span>
          </div>
          <div className="bg-[#161622]/60 p-3 rounded-xl border border-[#252538]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E9EB6] block">
              Real Votes Cast
            </span>
            <span className="text-base sm:text-lg font-black text-[#9B7BFF]">
              {stats?.totalVotes ?? 0}
            </span>
          </div>
          <div className="bg-[#161622]/60 p-3 rounded-xl border border-[#252538]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E9EB6] block">
              Discussion Comments
            </span>
            <span className="text-base sm:text-lg font-black text-sky-400">
              {stats?.totalComments ?? 0}
            </span>
          </div>
          <div className="bg-[#161622]/60 p-3 rounded-xl border border-[#252538]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E9EB6] block">
              Reactions & Likes
            </span>
            <span className="text-base sm:text-lg font-black text-rose-400">
              {stats?.totalLikes ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Community Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#1D1D2B] border border-[#2C2C40] rounded-xl text-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterType('all')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-[#101018] text-[#9B7BFF] border border-[#3E3E58]'
                : 'text-[#9E9EB6] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Latest</span>
          </button>

          <button
            onClick={() => setFilterType('discussed')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterType === 'discussed'
                ? 'bg-[#101018] text-[#9B7BFF] border border-[#3E3E58]'
                : 'text-[#9E9EB6] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>Most Discussed</span>
          </button>

          <button
            onClick={() => setFilterType('trending')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              filterType === 'trending'
                ? 'bg-[#101018] text-[#9B7BFF] border border-[#3E3E58]'
                : 'text-[#9E9EB6] hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Twists</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#6C6C82] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search community..."
            className="w-full sm:w-48 bg-[#101018] border border-[#2C2C40] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6C6C82] focus:outline-none focus:border-[#9B7BFF]"
          />
        </div>
      </div>

      {/* Community Feed */}
      {communityPolls.length > 0 ? (
        <div className="space-y-4">
          {communityPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onPollUpdated={onPollUpdated}
              onShare={onShare}
              onReport={onReport}
              onOpenDisclaimer={onOpenDisclaimer}
              defaultShowComments={poll.commentCount > 0}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={searchQuery ? 'No community polls match your search' : 'No community polls yet'}
          description={
            searchQuery 
              ? `No polls found matching "${searchQuery}". Try a different keyword or create this discussion yourself!` 
              : 'Be the very first community member to create a poll! No sign-up or email needed.'
          }
          actionText="Create Community Poll"
          onAction={onCreatePoll}
        />
      )}
    </div>
  );
};
