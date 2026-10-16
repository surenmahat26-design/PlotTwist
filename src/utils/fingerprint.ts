const STORAGE_KEY = 'plottwist_voter_token';

/**
 * Retrieves or initializes an anonymous client browser token for duplicate-voting protection.
 * Combines a random UUID with client traits to create an anonymous identifier.
 */
export function getOrCreateVoterToken(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 16) {
      return existing;
    }

    // Generate random entropy combined with simple client attributes
    const randomPart = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const screenPart = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '0x0';
    const newToken = `pt_voter_${randomPart}_${screenPart}`.replace(/[^a-zA-Z0-9_-]/g, '');

    localStorage.setItem(STORAGE_KEY, newToken);
    return newToken;
  } catch {
    // Fallback if localStorage is disabled or restricted in private mode
    return `pt_anon_${Math.random().toString(36).substring(2, 14)}`;
  }
}

/**
 * Format ISO date string into readable relative time
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch {
    return 'Recently';
  }
}

/**
 * Explanation of how duplicate voting protection works
 */
export const DUPLICATE_VOTING_DISCLAIMER = {
  title: 'Anonymous Duplicate Vote Protection',
  summary: 'PlotTwist does not require registration or personal data. Instead, it uses an anonymous browser identifier stored in your browser session alongside server-side verification.',
  caveat: 'While this reliably prevents accidental duplicate votes and double clicks in standard usage, it cannot strictly guarantee one vote per real person if private browsing, cookie-clearing, or alternative browsers are used.'
};
