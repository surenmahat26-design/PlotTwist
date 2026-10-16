import { 
  Poll, 
  CreatePollPayload, 
  CategoryInfo, 
  PlatformStats, 
  SortOption, 
  FilterOption,
  PollComment
} from '../types/poll.ts';
import { getOrCreateVoterToken } from './fingerprint.ts';

const voterToken = getOrCreateVoterToken();

function getHeaders(isJson = true): HeadersInit {
  const headers: Record<string, string> = {
    'x-voter-fingerprint': voterToken
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function uploadImage(file: File): Promise<{ url: string; filename: string; size: number }> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: getHeaders(false),
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Image upload failed. Max size is 5MB.');
  }

  return res.json();
}

export async function fetchPolls(params?: {
  sort?: SortOption;
  filter?: FilterOption;
  category?: string;
  search?: string;
}): Promise<{ polls: Poll[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.sort) query.set('sort', params.sort);
  if (params?.filter) query.set('filter', params.filter);
  if (params?.category && params.category !== 'All') query.set('category', params.category);
  if (params?.search && params.search.trim()) query.set('search', params.search.trim());

  const res = await fetch(`/api/polls?${query.toString()}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch polls');
  }

  return res.json();
}

export async function fetchPollById(idOrSlug: string): Promise<Poll> {
  const res = await fetch(`/api/polls/${encodeURIComponent(idOrSlug)}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Poll not found');
  }

  return res.json();
}

export async function createPoll(payload: CreatePollPayload): Promise<Poll> {
  const res = await fetch('/api/polls', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create poll');
  }

  return res.json();
}

export async function castVote(pollId: string, optionId: string): Promise<{ success: boolean; poll: Poll }> {
  const res = await fetch(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      optionId,
      voterFingerprint: voterToken
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Failed to cast vote') as any;
    error.alreadyVoted = errorData.alreadyVoted;
    error.userVotedOptionId = errorData.userVotedOptionId;
    throw error;
  }

  return res.json();
}

export async function togglePollLike(pollId: string): Promise<{ success: boolean; liked: boolean; likeCount: number }> {
  const res = await fetch(`/api/polls/${encodeURIComponent(pollId)}/like`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      voterFingerprint: voterToken
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update like status');
  }

  return res.json();
}

export async function fetchPollComments(pollId: string, sort?: 'newest' | 'oldest'): Promise<{ comments: PollComment[]; total: number }> {
  const query = sort ? `?sort=${sort}` : '';
  const res = await fetch(`/api/polls/${encodeURIComponent(pollId)}/comments${query}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch comments');
  }

  return res.json();
}

export async function addPollComment(
  pollId: string, 
  commentText: string, 
  authorName?: string
): Promise<{ success: boolean; comment: PollComment }> {
  const res = await fetch(`/api/polls/${encodeURIComponent(pollId)}/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      commentText,
      authorName,
      voterFingerprint: voterToken
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add comment');
  }

  return res.json();
}

export async function reportPoll(pollId: string, reason: string, details?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/polls/${encodeURIComponent(pollId)}/report`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      reason,
      details,
      reporterFingerprint: voterToken
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to report poll');
  }

  return res.json();
}

export async function reportComment(commentId: string, reason: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/comments/${encodeURIComponent(commentId)}/report`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      reason,
      reporterFingerprint: voterToken
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to report comment');
  }

  return res.json();
}

export async function fetchCategories(): Promise<CategoryInfo[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) {
    throw new Error('Failed to load categories');
  }
  return res.json();
}

export async function fetchStats(): Promise<PlatformStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) {
    throw new Error('Failed to load stats');
  }
  return res.json();
}
