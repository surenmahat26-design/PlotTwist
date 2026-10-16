import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Image as ImageIcon, 
  X, 
  UploadCloud 
} from 'lucide-react';
import { Poll } from '../types/poll.ts';
import { createPoll, uploadImage } from '../utils/api.ts';

interface CreatePollProps {
  onPollCreated: (poll: Poll) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'General',
  'Tech',
  'Entertainment',
  'Society',
  'Gaming',
  'Food',
  'Sports',
  'Science',
  'Culture'
];

export const CreatePollView: React.FC<CreatePollProps> = ({ onPollCreated, onCancel }) => {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index));
    }
  };

  // Image Selection & Client Validation
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, or GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 5MB.');
      return;
    }

    setError(null);
    setImageFile(file);

    // Create local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to real backend disk storage
    setUploadingImage(true);
    try {
      const uploadRes = await uploadImage(file);
      setUploadedImageUrl(uploadRes.url);
    } catch (uploadErr: any) {
      setError(uploadErr.message || 'Failed to upload image to server.');
      setImageFile(null);
      setImagePreview(null);
      setUploadedImageUrl(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): string | null => {
    const q = question.trim();
    if (q.length < 5) {
      return 'The question must be at least 5 characters long.';
    }
    if (q.length > 280) {
      return 'The question cannot exceed 280 characters.';
    }

    const filledOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (filledOptions.length < 2) {
      return 'Please provide at least 2 non-empty answer options.';
    }

    const lowerSet = new Set<string>();
    for (const opt of filledOptions) {
      const lower = opt.toLowerCase();
      if (lowerSet.has(lower)) {
        return `Duplicate answer option: "${opt}". Each option must be distinct.`;
      }
      lowerSet.add(lower);
    }

    for (const opt of filledOptions) {
      if (opt.length > 100) {
        return `Option "${opt.slice(0, 20)}..." exceeds 100 characters.`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImage) {
      setError('Please wait for the image to finish uploading.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const validOptions = options.map(o => o.trim()).filter(o => o.length > 0);
      const newPoll = await createPoll({
        question: question.trim(),
        description: description.trim(),
        category,
        imageUrl: uploadedImageUrl || undefined,
        options: validOptions
      });
      onPollCreated(newPoll);
    } catch (err: any) {
      setError(err.message || 'Failed to create poll. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-16 sm:pb-8">
      {/* Header Back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="p-2 rounded-xl bg-[#1D1D2B] border border-[#2C2C40] text-[#9E9EB6] hover:text-white hover:bg-[#252538] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Create a Poll</span>
            <Sparkles className="w-5 h-5 text-[#9B7BFF]" />
          </h1>
          <p className="text-xs text-[#9E9EB6]">
            No account required. Add your question, choices, and watch the twists roll in.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#1D1D2B] border border-[#2C2C40] rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#9E9EB6]">
              Question <span className="text-[#9B7BFF]">*</span>
            </label>
            <span className={`text-[11px] ${question.length > 280 ? 'text-rose-400 font-bold' : 'text-[#6C6C82]'}`}>
              {question.length}/280
            </span>
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Which sci-fi technology will impact your daily life first?"
            rows={2}
            className="w-full bg-[#101018] border border-[#2C2C40] rounded-xl p-3.5 text-sm text-white placeholder-[#6C6C82] focus:outline-none focus:border-[#9B7BFF] focus:ring-1 focus:ring-[#9B7BFF] transition-all resize-none"
            required
          />
        </div>

        {/* Description Field (Optional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#9E9EB6]">
              Context or Description <span className="text-[11px] text-[#6C6C82] lowercase font-normal">(optional)</span>
            </label>
            <span className="text-[11px] text-[#6C6C82]">
              {description.length}/500
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add background context, rules, or details about the question..."
            rows={2}
            className="w-full bg-[#101018] border border-[#2C2C40] rounded-xl p-3 text-xs text-white placeholder-[#6C6C82] focus:outline-none focus:border-[#9B7BFF] resize-none"
          />
        </div>

        {/* Image Attachment (Item 3) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#9E9EB6] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#9B7BFF]" />
              <span>Image Attachment <span className="text-[11px] text-[#6C6C82] lowercase font-normal">(optional)</span></span>
            </label>
            <span className="text-[11px] text-[#6C6C82]">Max 5MB (JPG, PNG, WebP)</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative rounded-xl border border-[#2C2C40] overflow-hidden bg-[#101018] group">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-full max-h-60 object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#252538] hover:bg-[#32324A] text-xs font-semibold text-white shadow-md transition-colors"
                >
                  Replace Image
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white shadow-md transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {uploadingImage && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 text-xs font-semibold text-white">
                  <Loader2 className="w-4 h-4 text-[#9B7BFF] animate-spin" />
                  <span>Uploading image to server...</span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 px-4 rounded-xl border border-dashed border-[#2C2C40] hover:border-[#9B7BFF] bg-[#161622]/50 hover:bg-[#161622] text-[#9E9EB6] hover:text-white transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
            >
              <UploadCloud className="w-6 h-6 text-[#9B7BFF] group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <span className="text-xs font-semibold block text-[#E2E2F0]">Click to attach an image</span>
                <span className="text-[11px] text-[#6C6C82]">Stored on persistent server disk</span>
              </div>
            </button>
          )}
        </div>

        {/* Category Picker */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#9E9EB6]">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-[#9B7BFF] text-[#101018] font-bold shadow-md shadow-[#9B7BFF]/20'
                    : 'bg-[#101018] text-[#9E9EB6] border border-[#2C2C40] hover:text-white hover:bg-[#252538]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#9E9EB6]">
              Answer Options ({options.length}/6) <span className="text-[#9B7BFF]">*</span>
            </label>
            <span className="text-[11px] text-[#6C6C82]">Min 2, max 6</span>
          </div>

          <div className="space-y-2.5">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-[#6C6C82]">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  maxLength={100}
                  className="flex-1 bg-[#101018] border border-[#2C2C40] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#6C6C82] focus:outline-none focus:border-[#9B7BFF] transition-all"
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="p-2.5 rounded-xl text-[#6C6C82] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove this option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-[#3E3E58] hover:border-[#9B7BFF] bg-[#161622]/50 hover:bg-[#252538] text-xs font-semibold text-[#9B7BFF] transition-all mt-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Option</span>
            </button>
          )}
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-[#2C2C40] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#9E9EB6] hover:text-white hover:bg-[#252538] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#9B7BFF] hover:bg-[#8A64FF] text-[#101018] text-xs font-extrabold transition-all shadow-lg shadow-[#9B7BFF]/25 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Poll...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Publish Poll</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
