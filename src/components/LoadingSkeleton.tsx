import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 w-full">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="w-full bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl p-5 sm:p-6 space-y-4"
        >
          {/* Header row skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-16 h-5 rounded-full skeleton-shimmer" />
              <div className="w-20 h-5 rounded-full skeleton-shimmer" />
            </div>
            <div className="w-24 h-4 rounded skeleton-shimmer" />
          </div>

          {/* Question title skeleton */}
          <div className="space-y-2">
            <div className="w-4/5 h-6 rounded skeleton-shimmer" />
            <div className="w-2/3 h-4 rounded skeleton-shimmer" />
          </div>

          {/* Options skeleton */}
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3].map((opt) => (
              <div key={opt} className="w-full h-12 rounded-xl skeleton-shimmer" />
            ))}
          </div>

          {/* Footer skeleton */}
          <div className="pt-3 border-t border-[#2C2C40] flex justify-between">
            <div className="w-20 h-5 rounded skeleton-shimmer" />
            <div className="w-14 h-5 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};
