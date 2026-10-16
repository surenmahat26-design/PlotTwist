import React, { useState } from 'react';
import { X, Check, Copy, Share2, MessageCircle, ExternalLink } from 'lucide-react';
import { Poll } from '../types/poll.ts';

interface ShareModalProps {
  poll: Poll | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ poll, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !poll) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${currentOrigin}/?poll=${encodeURIComponent(poll.slug || poll.id)}`;
  const shareText = `Vote on PlotTwist: "${poll.question}"`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for iframe restrictions
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: poll.question,
          text: `Vote on PlotTwist: "${poll.question}"`,
          url: shareUrl
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(poll.question)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl p-6 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2C2C40]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#9B7BFF]/15 text-[#9B7BFF]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Share this Poll</h3>
              <p className="text-xs text-[#9E9EB6]">Invite friends and gather twists</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9E9EB6] hover:text-white hover:bg-[#252538] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Poll Summary */}
        <div className="my-4 p-3 bg-[#161622] rounded-xl border border-[#252538]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9B7BFF]">
            {poll.category}
          </span>
          <p className="text-sm font-medium text-white line-clamp-2 mt-1">
            {poll.question}
          </p>
          <p className="text-[11px] text-[#9E9EB6] mt-1.5">
            {poll.totalVotes} total votes • {poll.options.length} options
          </p>
        </div>

        {/* Direct Link Copy */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EB6]">
            Unique Shareable Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-[#101018] border border-[#2C2C40] rounded-xl px-3.5 py-2.5 text-xs text-[#E2E2F0] font-mono focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="mt-6 pt-5 border-t border-[#2C2C40] space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EB6]">
            Share Directly
          </label>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#161622] hover:bg-[#252538] border border-[#2C2C40] text-xs font-medium text-white transition-all group"
            >
              <span className="font-bold">X</span>
              <span className="text-[#9E9EB6] group-hover:text-white">Post</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#161622] hover:bg-[#252538] border border-[#2C2C40] text-xs font-medium text-white transition-all group"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[#9E9EB6] group-hover:text-white">WhatsApp</span>
            </a>

            <a
              href={redditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#161622] hover:bg-[#252538] border border-[#2C2C40] text-xs font-medium text-white transition-all group"
            >
              <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[#9E9EB6] group-hover:text-white">Reddit</span>
            </a>
          </div>

          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full mt-2 py-2.5 px-3 rounded-xl bg-[#252538] hover:bg-[#32324A] text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-[#9B7BFF]" />
              <span>More Share Options...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
