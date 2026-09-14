/**
 * Formats any date, ISO timestamp, or epoch into a clean, human-friendly relative time string.
 * Examples: "Just now", "2 min ago", "4 hr ago", "1 day ago", "3 days ago"
 */
export function formatRelativeTime(input?: string | number | Date | null): string {
  if (!input) return '';
  try {
    let d: Date;
    if (input instanceof Date) {
      d = input;
    } else if (typeof input === 'number') {
      d = new Date(input);
    } else if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) return '';

      // Handle Indian timezone formats like "07-Sep-2026 18:00 IST" or "18:00 IST"
      let cleaned = trimmed;
      if (cleaned.endsWith(' IST')) {
        cleaned = cleaned.replace(/\s+IST$/, ' +0530');
      }

      d = new Date(cleaned);

      // If still invalid, check if it was time-only like "18:00 +0530" or "18:00"
      if (isNaN(d.getTime())) {
        const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*IST)?$/i);
        if (timeMatch) {
          const now = new Date();
          now.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), timeMatch[3] ? parseInt(timeMatch[3], 10) : 0, 0);
          d = now;
        } else {
          d = new Date(trimmed);
        }
      }
    } else {
      return '';
    }

    if (isNaN(d.getTime())) {
      return typeof input === 'string' ? input : '';
    }

    const now = Date.now();
    const diffMs = now - d.getTime();

    // In future (e.g. upcoming board meeting or scheduled event)
    if (diffMs < -30000) {
      const absMs = Math.abs(diffMs);
      const futureMins = Math.round(absMs / (1000 * 60));
      if (futureMins < 60) return `in ${futureMins} min`;
      const futureHours = Math.round(futureMins / 60);
      if (futureHours < 24) return `in ${futureHours} hr`;
      const futureDays = Math.round(futureHours / 24);
      return futureDays === 1 ? 'tomorrow' : `in ${futureDays} days`;
    }

    const diffSecs = Math.floor(Math.max(0, diffMs) / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 45) return 'Just now';
    if (diffMins < 60) return diffMins === 1 ? '1 min ago' : `${diffMins} min ago`;
    if (diffHours < 24) return diffHours === 1 ? '1 hr ago' : `${diffHours} hr ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return diffWeeks === 1 ? '1 wk ago' : `${diffWeeks} wks ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return diffMonths === 1 ? '1 mo ago' : `${diffMonths} mo ago`;
    return `${Math.floor(diffDays / 365)} yr ago`;
  } catch {
    return typeof input === 'string' ? input : '';
  }
}
