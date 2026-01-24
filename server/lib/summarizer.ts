import OpenAI from 'openai';

const MAX_ARTICLE_LENGTH = 3000;

/**
 * Generates a 2-3 sentence summary of an article using OpenAI's gpt-4o-mini model.
 * Falls back to first 200 characters of article text on API error.
 */
export async function generateSummary(
  articleText: string,
  title: string
): Promise<string> {
  // Validate inputs
  if (!articleText || articleText.trim().length === 0) {
    console.log('[summarizer] No article text provided, returning empty summary');
    return '';
  }

  // Truncate article text if needed
  const truncatedText =
    articleText.length > MAX_ARTICLE_LENGTH
      ? articleText.substring(0, MAX_ARTICLE_LENGTH)
      : articleText;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[summarizer] OPENAI_API_KEY not set, falling back to text excerpt');
    return getFallbackSummary(articleText);
  }

  try {
    const openai = new OpenAI({ apiKey });

    const prompt = `Summarize this article in 2-3 sentences. Be informative and neutral in tone. Article title: ${title}. Article content: ${truncatedText}`;

    console.log(`[summarizer] Generating summary for: "${title}"`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const summary = response.choices[0]?.message?.content?.trim();

    if (!summary) {
      console.warn('[summarizer] Empty response from OpenAI, falling back to text excerpt');
      return getFallbackSummary(articleText);
    }

    console.log(`[summarizer] Successfully generated summary for: "${title}"`);
    return summary;
  } catch (error) {
    console.error('[summarizer] OpenAI API error:', error);
    return getFallbackSummary(articleText);
  }
}

/**
 * Returns the first 200 characters of article text as a fallback summary.
 */
function getFallbackSummary(articleText: string): string {
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
