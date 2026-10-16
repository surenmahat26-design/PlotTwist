import React, { useState } from 'react';
import { Search, Compass, SlidersHorizontal, Sparkles, Filter, X } from 'lucide-react';
import { Poll, CategoryInfo, SortOption, FilterOption } from '../types/poll.ts';
import { PollCard } from './PollCard.tsx';

interface ExploreViewProps {
  polls: Poll[];
  categories: CategoryInfo[];
  currentSearch: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  onPollUpdated: (poll: Poll) => void;
  onShare: (poll: Poll) => void;
  onReport: (poll: Poll) => void;
  onOpenDisclaimer: () => void;
  onCreatePoll: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  polls,
  categories,
  currentSearch,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSort,
  onSortChange,
  selectedFilter,
  onFilterChange,
  onPollUpdated,
  onShare,
  onReport,
  onOpenDisclaimer,
  onCreatePoll
}) => {
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearchChange('');
  };

  return (
    <div className="w-full space-y-6">
      {/* Search Header Banner */}
      <div className="bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#9B7BFF]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="w-5 h-5 text-[#9B7BFF]" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Explore & Search Polls
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#9E9EB6] mb-5">
            Discover community discussions, debate hot topics, and compare perspectives across categories.
          </p>

          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-[#6C6C82] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search polls by keywords, topics, or questions..."
              className="w-full bg-[#101018] border border-[#2C2C40] focus:border-[#9B7BFF] rounded-xl pl-10 pr-24 py-3 text-xs sm:text-sm text-white placeholder-[#6C6C82] focus:outline-none focus:ring-1 focus:ring-[#9B7BFF] transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-20 p-1 text-[#6C6C82] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-3.5 py-1.5 rounded-lg bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] text-xs font-bold transition-all shadow-sm"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Category Horizontal Filter Carousel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#9E9EB6]">
          <span>Filter by Category</span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => onCategoryChange('All')}
              className="text-[#9B7BFF] hover:underline normal-case text-xs font-semibold"
            >
              Reset to All
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => onCategoryChange('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#9B7BFF] text-[#101018] shadow-md shadow-[#9B7BFF]/20'
                : 'bg-[#1D1D2B] text-[#9E9EB6] border border-[#2C2C40] hover:text-white hover:bg-[#252538]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onCategoryChange(cat.name)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.name
                  ? 'bg-[#9B7BFF] text-[#101018] shadow-md shadow-[#9B7BFF]/20'
                  : 'bg-[#1D1D2B] text-[#9E9EB6] border border-[#2C2C40] hover:text-white hover:bg-[#252538]'
              }`}
            >
              <span>{cat.name}</span>
              {cat.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.name ? 'bg-black/20 text-[#101018]' : 'bg-[#101018] text-[#9B7BFF]'
                }`}>
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Bar: Sort and Community/Sample Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#1D1D2B] border border-[#2C2C40] rounded-xl text-xs">
        {/* Source Filter */}
        <div className="flex items-center gap-1">
          <span className="text-[#6C6C82] mr-1 hidden sm:inline">Type:</span>
          {(['all', 'community', 'sample'] as FilterOption[]).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all capitalize ${
                selectedFilter === f
                  ? 'bg-[#101018] text-[#9B7BFF] border border-[#3E3E58] font-bold'
                  : 'text-[#9E9EB6] hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : f === 'community' ? 'Community' : 'Demo Samples'}
            </button>
          ))}
        </div>

        {/* Sort Filter */}
        <div className="flex items-center gap-1">
          <span className="text-[#6C6C82] mr-1 hidden sm:inline">Sort:</span>
          {(['recent', 'popular', 'trending'] as SortOption[]).map((s) => (
            <button
              key={s}
              onClick={() => onSortChange(s)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all capitalize ${
                selectedSort === s
                  ? 'bg-[#101018] text-[#9B7BFF] border border-[#3E3E58] font-bold'
                  : 'text-[#9E9EB6] hover:text-white'
              }`}
            >
              {s === 'recent' ? 'Newest' : s === 'popular' ? 'Most Votes' : 'Trending'}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#9E9EB6] px-1">
        <span>
          Showing {polls.length} {polls.length === 1 ? 'poll' : 'polls'}
          {currentSearch && ` matching "${currentSearch}"`}
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </span>
      </div>

      {/* Polls Feed List */}
      {polls.length > 0 ? (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onPollUpdated={onPollUpdated}
              onShare={onShare}
              onReport={onReport}
              onOpenDisclaimer={onOpenDisclaimer}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#9B7BFF]/10 text-[#9B7BFF] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">No polls found</h3>
            <p className="text-xs text-[#9E9EB6] max-w-sm mx-auto mt-1">
              {currentSearch 
                ? `No polls matched your search query "${currentSearch}". Try a different keyword or create this poll yourself!`
                : 'No polls available in this category yet. Be the first to start the conversation!'}
            </p>
          </div>
          <button
            onClick={onCreatePoll}
            className="px-5 py-2.5 rounded-xl bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create This Poll</span>
          </button>
        </div>
      )}
    </div>
  );
};
