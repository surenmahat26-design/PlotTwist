import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { Poll } from '../types/poll.ts';
import { reportPoll } from '../utils/api.ts';

interface ReportModalProps {
  poll: Poll | null;
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  'Spam or misleading content',
  'Hate speech, discrimination or harassment',
  'Inappropriate or sexually explicit material',
  'Violence or harmful activity',
  'Off-topic or low quality / trolling',
  'Other violation'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  poll,
  isOpen,
  onClose,
  onReportSubmitted
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !poll) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await reportPoll(poll.id, selectedReason, details);
      setSubmittedMessage(res.message);
      if (onReportSubmitted) {
        onReportSubmitted();
      }
      setTimeout(() => {
        setSubmittedMessage(null);
        setDetails('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl p-6 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2C2C40]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Report Inappropriate Poll</h3>
              <p className="text-xs text-[#9E9EB6]">Help keep PlotTwist safe and constructive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9E9EB6] hover:text-white hover:bg-[#252538] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedMessage ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Report Received</h4>
            <p className="text-xs text-[#9E9EB6] max-w-xs mx-auto">
              {submittedMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="p-3 bg-[#161622] rounded-xl border border-[#252538]">
              <p className="text-xs font-semibold text-[#9E9EB6]">Target Question:</p>
              <p className="text-sm font-medium text-white line-clamp-2 mt-0.5">
                "{poll.question}"
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EB6]">
                Reason for reporting
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReason === reason
                        ? 'bg-[#9B7BFF]/10 border-[#9B7BFF] text-white font-medium'
                        : 'bg-[#161622] border-[#252538] text-[#9E9EB6] hover:bg-[#252538]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-[#9B7BFF]"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EB6]">
                Additional context (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Briefly describe what is inappropriate..."
                maxLength={500}
                rows={3}
                className="w-full bg-[#101018] border border-[#2C2C40] rounded-xl p-3 text-xs text-white placeholder-[#6C6C82] focus:outline-none focus:border-[#9B7BFF] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2C2C40]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#9E9EB6] hover:text-white hover:bg-[#252538] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
