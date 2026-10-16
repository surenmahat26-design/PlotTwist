import React from 'react';
import { 
  Sparkles, 
  PlusCircle, 
  Compass, 
  Home, 
  ShieldAlert, 
  Users 
} from 'lucide-react';
import { NavTab } from '../types/poll.ts';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenDisclaimer: () => void;
  stats?: { totalPolls: number; totalVotes: number; communityPolls: number };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenDisclaimer,
  stats
}) => {
  return (
    <>
      {/* Desktop / Tablet Sticky Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#2C2C40] bg-[#101018]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo and Brand */}
          <div 
            onClick={() => onSelectTab('feed')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#7B55F5] to-[#9B7BFF] p-0.5 flex items-center justify-center shadow-lg shadow-[#9B7BFF]/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#101018] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#9B7BFF] group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  Plot<span className="text-[#9B7BFF]">Twist</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#9B7BFF]/15 text-[#B9A1FF] border border-[#9B7BFF]/25 hidden xs:inline">
                  Community
                </span>
              </div>
              <p className="text-[11px] text-[#9E9EB6] hidden md:block tracking-wide">
                Your opinion. Your vote. Your twist.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => onSelectTab('feed')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'feed'
                  ? 'bg-[#1D1D2B] text-white border border-[#3E3E58] shadow-sm'
                  : 'text-[#9E9EB6] hover:text-white hover:bg-[#1D1D2B]/50'
              }`}
            >
              <Home className="w-4 h-4 text-[#9B7BFF]" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onSelectTab('explore')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'explore'
                  ? 'bg-[#1D1D2B] text-white border border-[#3E3E58] shadow-sm'
                  : 'text-[#9E9EB6] hover:text-white hover:bg-[#1D1D2B]/50'
              }`}
            >
              <Compass className="w-4 h-4 text-[#9B7BFF]" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => onSelectTab('community')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'community'
                  ? 'bg-[#1D1D2B] text-white border border-[#3E3E58] shadow-sm'
                  : 'text-[#9E9EB6] hover:text-white hover:bg-[#1D1D2B]/50'
              }`}
            >
              <Users className="w-4 h-4 text-[#9B7BFF]" />
              <span>Community</span>
            </button>

            <button
              onClick={() => onSelectTab('create')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all shadow-md ml-1 cursor-pointer ${
                currentTab === 'create'
                  ? 'bg-[#9B7BFF] text-[#101018] shadow-[#9B7BFF]/30 scale-102'
                  : 'bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] hover:shadow-[#9B7BFF]/25'
              }`}
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Create Poll</span>
            </button>

            {/* Duplicate protection info button */}
            <button
              onClick={onOpenDisclaimer}
              title="How anonymous duplicate-voting protection works"
              className="p-2 ml-1 rounded-lg text-[#6C6C82] hover:text-[#B9A1FF] hover:bg-[#1D1D2B] transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile Right: Info button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenDisclaimer}
              title="Anonymous protection info"
              className="p-2 rounded-lg text-[#9E9EB6] hover:text-white bg-[#1D1D2B] border border-[#2C2C40]"
            >
              <ShieldAlert className="w-4 h-4 text-[#9B7BFF]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Clean Bottom Navigation (Home, Explore, Community, Create) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#101018]/95 border-t border-[#2C2C40] backdrop-blur-lg px-2 py-1.5 flex items-center justify-around safe-area-inset-bottom">
        <button
          onClick={() => onSelectTab('feed')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'feed'
              ? 'text-[#9B7BFF] font-bold'
              : 'text-[#9E9EB6] hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'feed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('explore')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'explore'
              ? 'text-[#9B7BFF] font-bold'
              : 'text-[#9E9EB6] hover:text-white'
          }`}
        >
          <Compass className={`w-5 h-5 ${currentTab === 'explore' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Explore</span>
        </button>

        <button
          onClick={() => onSelectTab('community')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'community'
              ? 'text-[#9B7BFF] font-bold'
              : 'text-[#9E9EB6] hover:text-white'
          }`}
        >
          <Users className={`w-5 h-5 ${currentTab === 'community' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Community</span>
        </button>

        <button
          onClick={() => onSelectTab('create')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'create'
              ? 'text-[#9B7BFF] font-bold'
              : 'text-[#9E9EB6] hover:text-white'
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            currentTab === 'create' ? 'bg-[#9B7BFF] text-[#101018]' : 'bg-[#1D1D2B] text-[#9B7BFF]'
          }`}>
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px]">Create</span>
        </button>
      </div>
    </>
  );
};
