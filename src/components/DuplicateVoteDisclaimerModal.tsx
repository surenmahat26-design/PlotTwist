import React from 'react';
import { X, ShieldCheck, Info, AlertCircle, Fingerprint } from 'lucide-react';
import { DUPLICATE_VOTING_DISCLAIMER } from '../utils/fingerprint.ts';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DuplicateVoteDisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl p-6 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2C2C40]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#9B7BFF]/15 text-[#9B7BFF]">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {DUPLICATE_VOTING_DISCLAIMER.title}
              </h3>
              <p className="text-xs text-[#9E9EB6]">Privacy-first frictionless voting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9E9EB6] hover:text-white hover:bg-[#252538] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs text-[#E2E2F0] leading-relaxed">
          <div className="p-3.5 bg-[#161622] rounded-xl border border-[#252538] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                No Sign-Up or Tracking
              </h4>
              <p className="text-[#9E9EB6]">
                {DUPLICATE_VOTING_DISCLAIMER.summary}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold uppercase tracking-wider text-[11px] text-[#9B7BFF]">
              How it works under the hood
            </h5>
            <ul className="space-y-2 list-none">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9B7BFF] mt-1.5 shrink-0" />
                <span>
                  <strong>Anonymous Browser Token:</strong> Your client securely generates an anonymous cryptographic identifier stored in local session storage.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9B7BFF] mt-1.5 shrink-0" />
                <span>
                  <strong>Server-Side Vote Validation:</strong> When you vote, the server checks the database to verify whether this browser has already cast a vote for this specific poll.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9B7BFF] mt-1.5 shrink-0" />
                <span>
                  <strong>Tamper Protection:</strong> Vote totals and percentages are strictly computed and stored on the server; client requests cannot manipulate vote numbers directly.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/25 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-300 text-xs mb-1">
                Transparency & Practical Limits
              </h4>
              <p className="text-amber-200/80">
                {DUPLICATE_VOTING_DISCLAIMER.caveat}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#2C2C40] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] text-xs font-bold transition-all shadow-md"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
