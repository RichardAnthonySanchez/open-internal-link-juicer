// Common SEO stop words and generic noisy terms to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'you', 'your', 'this', 'they', 'but', 'have', 'had', 'what',
  'when', 'where', 'who', 'which', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now',
  'also', 'into', 'over', 'after', 'before', 'between', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'about', 'above', 'below',
  // Generic generic verbs/nouns that add noise as unigrams
  'use', 'used', 'using', 'get', 'got', 'getting', 'make', 'made', 'making',
  'way', 'ways', 'thing', 'things', 'take', 'took', 'taking', 'look', 'looks',
  'want', 'wants', 'need', 'needs', 'give', 'gives', 'find', 'finds', 'think',
  'know', 'knows', 'see', 'sees', 'feel', 'seems', 'call', 'called', 'work',
  'point', 'fact', 'good', 'better', 'best', 'great', 'new', 'old', 'big', 'small',
  'well', 'really', 'even', 'actually', 'quite', 'just', 'only', 'also', 'still',
  'many', 'much', 'very', 'more', 'most', 'some', 'any', 'each', 'every', 'within'
]);


export interface LinkOpportunity {
  url: string;
  score: number;
  semanticScore?: number;
  semanticMatch?: {
    score: number;
    chunkText: string;
    chunkIndex: number;
  };
  explanation: string;
  matchedKeywords: string[];
  slugKeywords: string[];
}



export interface AnalysisResult {
  opportunities: LinkOpportunity[];
  articleKeywords: string[];
  totalUrls: number;
}

// Robust detector for URL-like artifacts
function isUrlLike(word: string): boolean {
  if (word.includes('.') || word.includes('/') || word.includes('www')) return true;
  if (word.length > 20) return true;
  // If word contains more than one hyphen, it's likely a slug or URL fragment
  const hyphenCount = (word.match(/-/g) || []).length;
  if (hyphenCount > 1) return true;
  return false;
}

// Validation for n-grams (phrases)
function isValidNGram(...words: string[]): boolean {
  // N-gram must not start or end with a stop word
  if (STOP_WORDS.has(words[0]) || STOP_WORDS.has(words[words.length - 1])) return false;
  // Must not have words that are too short (except for common abbreviations)
  if (words.some(w => w.length < 2)) return false;
  // None of the words should be url-like
  if (words.some(w => isUrlLike(w))) return false;
  return true;
}

// Extract keywords and phrases (N-Grams) from text
function extractKeywords(text: string): Map<string, number> {
  const cleanText = text.toLowerCase().replace(/[^\w\s-]/g, ' ');
  const tokens = cleanText.split(/\s+/).filter(t => t.length > 0);

  const keywordCounts = new Map<string, number>();

  // Extract Unigrams (1-word)
  tokens.forEach(word => {
    // Stricter criteria for unigrams to reduce noise
    if (word.length > 3 && !STOP_WORDS.has(word) && !isUrlLike(word)) {
      keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
    }
  });

  // Extract Bigrams (2-word phrases like "use case")
  for (let i = 0; i < tokens.length - 1; i++) {
    if (isValidNGram(tokens[i], tokens[i + 1])) {
      const gram = `${tokens[i]} ${tokens[i + 1]}`;
      keywordCounts.set(gram, (keywordCounts.get(gram) || 0) + 1);
    }
  }

  // Extract Trigrams (3-word phrases like "content marketing strategy")
  for (let i = 0; i < tokens.length - 2; i++) {
    if (isValidNGram(tokens[i], tokens[i + 1], tokens[i + 2])) {
      const gram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      keywordCounts.set(gram, (keywordCounts.get(gram) || 0) + 1);
    }
  }

  return keywordCounts;
}

// Extract keywords from the final URL segment (the slug)
function extractSlugKeywords(url: string): string[] {
  // consistent cleaning: remove protocol, domain, trailing slash, queries
  let cleanUrl = url
    .replace(/^https?:\/\/[^\/]+/, '') // remove protocol://domain
    .split('?')[0] // remove query params
    .split('#')[0] // remove hash
    .replace(/\/$/, ''); // remove trailing slash

  // If the URL was just a domain (e.g. moz.com) or turned empty, handle gracefully
  if (!cleanUrl) return [];

  // Get the part after the last slash
  // For '/learn/seo', lastIndex is before 'seo'.
  // For 'seo', lastIndex is -1.
  const lastSlashIndex = cleanUrl.lastIndexOf('/');
  const segment = lastSlashIndex !== -1
    ? cleanUrl.substring(lastSlashIndex + 1)
    : cleanUrl;

  // Clean the segment (remove common file extensions)
  const cleanSegment = segment
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase();

  return cleanSegment
    .split(/[-_]+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word) && !isUrlLike(word));
}

// No weighted keywords needed for strict exact matching


// Calculate relevance score based on strict exact keyword overlap
function calculateRelevance(
  slugKeywords: string[],
  articleKeywords: Map<string, number>,
  excludedKeywords: string[] = []
): { score: number; matchedKeywords: string[]; explanation: string } {
  if (slugKeywords.length === 0) {
    return { score: 0, matchedKeywords: [], explanation: 'No identifiable keywords in URL' };
  }

  const excludedSet = new Set(excludedKeywords.map(k => k.toLowerCase()));
  const matchedKeywords: string[] = [];
  let matchScore = 0;

  // Check for strict exact matches only
  slugKeywords.forEach(slugWord => {
    const lowerSlug = slugWord.toLowerCase();
    if (excludedSet.has(lowerSlug)) return;

    if (articleKeywords.has(lowerSlug)) {
      matchedKeywords.push(lowerSlug);
      // Base score on frequency in article
      matchScore += Math.min(articleKeywords.get(lowerSlug)! * 20, 50);
    }
  });

  // Normalize score to 0-100
  const normalizedScore = Math.min(matchScore, 100);

  // Generate explanation
  let explanation = '';
  if (matchedKeywords.length > 0) {
    explanation = `Matched keywords focus on: ${matchedKeywords.slice(0, 3).join(', ')}.`;
  } else {
    explanation = `No significant keyword overlap detected.`;
  }

  return { score: normalizedScore, matchedKeywords, explanation };
}

// Main analysis function
export function analyzeInternalLinks(
  articleContent: string,
  urls: string[],
  mode: 'individual' | 'batch',
  maxResults: number = 20,
  excludedKeywords: string[] = []
): AnalysisResult {
  // Extract article keywords
  const allArticleKeywords = extractKeywords(articleContent);

  // Filter out excluded keywords
  const excludedSet = new Set(excludedKeywords.map(k => k.toLowerCase()));
  const articleKeywords = new Map(
    Array.from(allArticleKeywords.entries()).filter(([word]) => !excludedSet.has(word))
  );

  const allMatchedKeywords = new Set<string>();

  // Analyze each URL
  const opportunities: LinkOpportunity[] = urls
    .filter(url => url.trim().length > 0)
    .map(url => {
      const slugKeywords = extractSlugKeywords(url);
      const { score, matchedKeywords, explanation } = calculateRelevance(
        slugKeywords,
        articleKeywords, // Pass the full filtered articleKeywords map
        excludedKeywords
      );

      matchedKeywords.forEach(k => allMatchedKeywords.add(k));

      return {
        url: url.trim(),
        score,
        semanticScore: 0, // Will be updated by semantic analyzer if used
        explanation,
        matchedKeywords,
        slugKeywords
      };
    });


  // Combine top keywords with all keywords that actually generated matches
  // User Update: Detected keywords must EXCLUSIVELY come from the linking opportunities (slugs),
  // not from the article body. We only return matched slug keywords.
  const combinedKeywords = Array.from(allMatchedKeywords).sort();

  // Sort and filter based on mode and keyword presence
  const finalOpportunities = opportunities.filter(o => o.matchedKeywords.length > 0 && o.score > 0);

  if (mode === 'batch') {
    finalOpportunities.sort((a, b) => b.score - a.score);
    return {
      opportunities: finalOpportunities.slice(0, maxResults),
      articleKeywords: combinedKeywords,
      totalUrls: urls.length
    };
  }

  return {
    opportunities: finalOpportunities,
    articleKeywords: combinedKeywords,
    totalUrls: urls.length
  };
}

// Get score category for styling
export function getScoreCategory(score: number): 'high' | 'medium' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}
