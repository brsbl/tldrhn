/**
 * Formats a Unix timestamp (in seconds) as a relative time string.
 * Examples: "just now", "5 minutes ago", "2 hours ago", "1 day ago", "1 week ago"
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const secondsAgo = now - timestamp;

  if (secondsAgo < 0) {
    return 'just now';
  }

  if (secondsAgo < 60) {
    return 'just now';
  }

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return minutesAgo === 1 ? '1 minute ago' : `${minutesAgo} minutes ago`;
  }

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7) {
    return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
  }

  const weeksAgo = Math.floor(daysAgo / 7);
  return weeksAgo === 1 ? '1 week ago' : `${weeksAgo} weeks ago`;
}

/**
 * Formats a Unix timestamp (in seconds) as an absolute date string.
 * Example: "Jan 22, 2026 at 3:45 PM"
 * Suitable for use in tooltips.
 */
export function formatAbsoluteDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }

  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${month} ${day}, ${year} at ${hours}:${minutesStr} ${ampm}`;
}
