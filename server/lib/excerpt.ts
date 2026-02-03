/**
 * Generates an excerpt by extracting the first ~200 characters of article text.
 */
export function generateExcerpt(articleText: string): string {
  if (!articleText || articleText.trim().length === 0) {
    return '';
  }

  const cleanText = articleText.trim();
  if (cleanText.length <= 200) {
    return cleanText;
  }

  // Find the last space within 200 chars to avoid cutting words
  const truncated = cleanText.substring(0, 200);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 150) {
    return truncated.substring(0, lastSpace) + '...';
  }
  return truncated + '...';
}
