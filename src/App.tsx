import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Flame, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  AlertCircle, 
  Compass, 
  CheckCircle,
  PlusCircle,
  Users,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { Poll, CategoryInfo, PlatformStats, SortOption, FilterOption, NavTab } from './types/poll.ts';
import { fetchPolls, fetchPollById, fetchCategories, fetchStats } from './utils/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { PollCard } from './components/PollCard.tsx';
import { CreatePollView } from './components/CreatePollView.tsx';
import { ExploreView } from './components/ExploreView.tsx';
import { CommunityView } from './components/CommunityView.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { ReportModal } from './components/ReportModal.tsx';
import { DuplicateVoteDisclaimerModal } from './components/DuplicateVoteDisclaimerModal.tsx';
import { LoadingSkeleton } from './components/LoadingSkeleton.tsx';
import { EmptyState } from './components/EmptyState.tsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('feed');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feed Filter and Sort States
  const [feedSort, setFeedSort] = useState<SortOption>('trending');

  // Explore View States
  const [exploreSearch, setExploreSearch] = useState('');
  const [exploreCategory, setExploreCategory] = useState('All');
  const [exploreSort, setExploreSort] = useState<SortOption>('popular');
  const [exploreFilter, setExploreFilter] = useState<FilterOption>('all');

  // Modal States
  const [selectedSharePoll, setSelectedSharePoll] = useState<Poll | null>(null);
  const [selectedReportPoll, setSelectedReportPoll] = useState<Poll | null>(null);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  // Shared Poll via URL Param (?poll=...)
  const [sharedPollTargetId, setSharedPollTargetId] = useState<string | null>(null);
  const [sharedPollBanner, setSharedPollBanner] = useState<Poll | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check URL params for direct shared poll links on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const pollParam = urlParams.get('poll');
      if (pollParam) {
        setSharedPollTargetId(pollParam);
        fetchPollById(pollParam)
          .then((p) => {
            setSharedPollBanner(p);
          })
          .catch((err) => {
            console.error('Failed to load shared poll from URL parameter:', err);
          });
      }
    }
  }, []);

  // Fetch polls dynamically from the real backend database
  const loadPolls = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (currentTab === 'feed' || currentTab === 'community') {
        const data = await fetchPolls({
          sort: feedSort,
          filter: 'all'
        });
        setPolls(data.polls);
      } else if (currentTab === 'explore') {
        const data = await fetchPolls({
          sort: exploreSort,
          filter: exploreFilter,
          category: exploreCategory,
          search: exploreSearch
        });
        setPolls(data.polls);
      }
    } catch (err: any) {
      console.error('Error fetching polls:', err);
      // No silent fallbacks to fake data - display real error state
      setError(err.message || 'Unable to connect to the PlotTwist database server.');
      setPolls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentTab, feedSort, exploreSort, exploreFilter, exploreCategory, exploreSearch]);

  // Load Categories & Real Platform Stats
  const loadMetadata = useCallback(async () => {
    try {
      const [cats, st] = await Promise.all([
        fetchCategories().catch(() => []),
        fetchStats().catch(() => null)
      ]);
      setCategories(cats);
      if (st) setStats(st);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    if (currentTab !== 'create') {
      loadPolls();
    }
  }, [currentTab, loadPolls]);

  // Handle Poll update after a vote is cast or liked
  const handlePollUpdated = (updatedPoll: Poll) => {
    setPolls((prev) => prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)));
    if (sharedPollBanner && sharedPollBanner.id === updatedPoll.id) {
      setSharedPollBanner(updatedPoll);
    }
    // Refresh stats from backend
    fetchStats().then(st => st && setStats(st)).catch(() => {});
  };

  // Handle Poll Creation
  const handlePollCreated = (newPoll: Poll) => {
    setPolls((prev) => [newPoll, ...prev]);
    fetchStats().then(st => st && setStats(st)).catch(() => {});
    setCurrentTab('feed');
    setSharedPollTargetId(newPoll.id);
    setSelectedSharePoll(newPoll);
    showToast('Poll created and saved in database!');
  };

  return (
    <div className="min-h-screen bg-[#101018] text-[#F4F4F8] flex flex-col selection:bg-[#9B7BFF]/30 selection:text-[#B9A1FF]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#1D1D2B] border border-[#9B7BFF] text-white text-xs font-semibold shadow-2xl shadow-[#9B7BFF]/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4 text-[#9B7BFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        stats={stats ? { totalPolls: stats.totalPolls, totalVotes: stats.totalVotes, communityPolls: stats.communityPolls } : undefined}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Direct Link Banner when viewing a shared poll */}
        {sharedPollBanner && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#9B7BFF]/20 via-[#1D1D2B] to-[#1D1D2B] border border-[#9B7BFF]/40 flex items-center justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9B7BFF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Viewing Shared Poll</span>
              </span>
              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                "{sharedPollBanner.question}"
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedSharePoll(sharedPollBanner)}
                className="px-3 py-1.5 rounded-lg bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
              <button
                onClick={() => setSharedPollBanner(null)}
                className="text-xs text-[#9E9EB6] hover:text-white px-2 py-1 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* FEED TAB */}
        {currentTab === 'feed' && (
          <div className="space-y-6 pb-16 sm:pb-8">
            {/* Hero / Intro Header */}
            <div className="bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#9B7BFF]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 max-w-lg">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9B7BFF]/15 border border-[#9B7BFF]/25 text-[#B9A1FF] text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#9B7BFF]" />
                    <span>Real-Time Community Polling</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Your opinion. Your vote. <span className="text-[#9B7BFF]">Your twist.</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#9E9EB6] leading-relaxed">
                    Zero fake numbers. Every poll, vote, and discussion is verified and stored in the database without requiring registration.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={() => setCurrentTab('create')}
                    className="px-5 py-3 rounded-xl bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-[#9B7BFF]/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>Create a Poll</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('community')}
                    className="px-4 py-3 rounded-xl bg-[#161622] hover:bg-[#252538] border border-[#2C2C40] text-xs sm:text-sm font-semibold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-[#9B7BFF]" />
                    <span>Community Hub</span>
                  </button>
                </div>
              </div>

              {/* Real Stats Bar */}
              {stats && (
                <div className="mt-6 pt-5 border-t border-[#2C2C40] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E9EB6] block">
                      Active Polls
                    </span>
                    <span className="text-base sm:text-lg font-black text-white">
                      {stats.totalPolls.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E9EB6] block">
                      Verified Votes
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#9B7BFF]">
                      {stats.totalVotes.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E9EB6] block">
                      Discussions
                    </span>
                    <span className="text-base sm:text-lg font-black text-sky-400">
                      {stats.totalComments.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E9EB6] block">
                      Tamper Protection
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Enforced</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Feed Sort Controls */}
            <div className="flex items-center justify-between p-2 bg-[#1D1D2B] border border-[#2C2C40] rounded-xl text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFeedSort('trending')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    feedSort === 'trending'
                      ? 'bg-[#101018] text-[#9B7BFF] border border-[#3E3E58]'
                      : 'text-[#9E9EB6] hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Trending</span>
                </button>

                <button
                  onClick={() => setFeedSort('popular')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    feedSort === 'popular'
                      ? 'bg-[#101018] text-[#9B7BFF] border border-[#3E3E58]'
                      : 'text-[#9E9EB6] hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Most Votes</span>
                </button>

                <button
                  onClick={() => setFeedSort('recent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    feedSort === 'recent'
                      ? 'bg-[#101018] text-[#9B7BFF] border border-[#3E3E58]'
                      : 'text-[#9E9EB6] hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Newest</span>
                </button>
              </div>

              <button
                onClick={() => loadPolls(true)}
                disabled={refreshing}
                title="Refresh feed"
                className="p-1.5 rounded-lg text-[#9E9EB6] hover:text-white hover:bg-[#252538] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#9B7BFF]' : ''}`} />
              </button>
            </div>

            {/* Error Message with explicit Retry */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => loadPolls()}
                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-semibold text-rose-200 text-xs transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Polls Feed Content */}
            {loading ? (
              <LoadingSkeleton />
            ) : polls.length > 0 ? (
              <div className="space-y-4">
                {polls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onPollUpdated={handlePollUpdated}
                    onShare={(p) => setSelectedSharePoll(p)}
                    onReport={(p) => setSelectedReportPoll(p)}
                    onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
                    highlightId={sharedPollTargetId || undefined}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No polls found in the live database"
                description="All fake numbers and sample polls have been removed. Be the first to create a genuine community poll!"
                actionText="Create First Poll"
                onAction={() => setCurrentTab('create')}
              />
            )}
          </div>
        )}

        {/* EXPLORE & SEARCH TAB */}
        {currentTab === 'explore' && (
          <ExploreView
            polls={polls}
            categories={categories}
            currentSearch={exploreSearch}
            onSearchChange={(q) => setExploreSearch(q)}
            selectedCategory={exploreCategory}
            onCategoryChange={(c) => setExploreCategory(c)}
            selectedSort={exploreSort}
            onSortChange={(s) => setExploreSort(s)}
            selectedFilter={exploreFilter}
            onFilterChange={(f) => setExploreFilter(f)}
            onPollUpdated={handlePollUpdated}
            onShare={(p) => setSelectedSharePoll(p)}
            onReport={(p) => setSelectedReportPoll(p)}
            onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
            onCreatePoll={() => setCurrentTab('create')}
          />
        )}

        {/* COMMUNITY TAB (NEW) */}
        {currentTab === 'community' && (
          <CommunityView
            polls={polls}
            stats={stats}
            onPollUpdated={handlePollUpdated}
            onShare={(p) => setSelectedSharePoll(p)}
            onReport={(p) => setSelectedReportPoll(p)}
            onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
            onCreatePoll={() => setCurrentTab('create')}
          />
        )}

        {/* CREATE POLL TAB */}
        {currentTab === 'create' && (
          <CreatePollView
            onPollCreated={handlePollCreated}
            onCancel={() => setCurrentTab('feed')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2C2C40] bg-[#101018] py-8 text-center text-xs text-[#6C6C82] mb-12 sm:mb-0">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="font-extrabold text-white">
              Plot<span className="text-[#9B7BFF]">Twist</span>
            </span>
            <span>•</span>
            <span className="text-[#9E9EB6]">Your opinion. Your vote. Your twist.</span>
          </div>
          <p className="max-w-md mx-auto text-[11px] text-[#6C6C82]">
            100% real community polling powered by SQLite with server-side vote validation, anonymous duplicate protection, and image storage.
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px]">
            <button
              onClick={() => setIsDisclaimerOpen(true)}
              className="text-[#9E9EB6] hover:text-[#9B7BFF] transition-colors cursor-pointer"
            >
              Voting Integrity Details
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('feed')}
              className="text-[#9E9EB6] hover:text-white transition-colors cursor-pointer"
            >
              Feed
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('community')}
              className="text-[#9E9EB6] hover:text-white transition-colors cursor-pointer"
            >
              Community
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('explore')}
              className="text-[#9E9EB6] hover:text-white transition-colors cursor-pointer"
            >
              Explore
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ShareModal
        poll={selectedSharePoll}
        isOpen={Boolean(selectedSharePoll)}
        onClose={() => setSelectedSharePoll(null)}
      />

      <ReportModal
        poll={selectedReportPoll}
        isOpen={Boolean(selectedReportPoll)}
        onClose={() => setSelectedReportPoll(null)}
      />

      <DuplicateVoteDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
    </div>
  );
}
