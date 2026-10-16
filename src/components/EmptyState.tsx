import React from 'react';
import { Sparkles, MessageCircleQuestion } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No polls here yet',
  description = 'Be the pioneer! Create a poll and watch your community share their twist.',
  actionText = 'Create First Poll',
  onAction
}) => {
  return (
    <div className="w-full bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl p-8 sm:p-12 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-[#9B7BFF]/10 text-[#9B7BFF] flex items-center justify-center mx-auto shadow-inner">
        <MessageCircleQuestion className="w-7 h-7" />
      </div>

      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-lg font-bold text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#9E9EB6]">
          {description}
        </p>
      </div>

      {onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] text-xs font-bold transition-all shadow-md shadow-[#9B7BFF]/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
};
