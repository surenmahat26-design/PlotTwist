export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
  orderIndex: number;
}

export interface Poll {
  id: string;
  slug: string;
  question: string;
  description: string;
  category: string;
  imageUrl?: string;
  isSample: boolean;
  isVerifiedOrg: boolean;
  totalVotes: number;
  reportCount: number;
  status: 'active' | 'reported_hidden' | 'closed';
  createdAt: string;
  updatedAt: string;
  options: PollOption[];
  hasVoted: boolean;
  userVotedOptionId: string | null;
  likeCount: number;
  hasLiked: boolean;
  commentCount: number;
}

export interface PollComment {
  id: string;
  pollId: string;
  commentText: string;
  authorName: string;
  createdAt: string;
  reportCount: number;
}

export interface CreatePollPayload {
  question: string;
  description?: string;
  category: string;
  imageUrl?: string;
  options: string[];
}

export interface CategoryInfo {
  name: string;
  count: number;
}

export interface PlatformStats {
  totalPolls: number;
  totalVotes: number;
  communityPolls: number;
  totalComments: number;
  totalLikes: number;
  samplePolls: number;
}

export type SortOption = 'recent' | 'popular' | 'trending';
export type FilterOption = 'all' | 'community' | 'sample';
export type NavTab = 'feed' | 'explore' | 'community' | 'create';
