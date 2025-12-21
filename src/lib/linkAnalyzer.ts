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

// SEO-related term weights for better matching
const SEO_TERM_WEIGHTS: Record<string, number> = {
  'seo': 2.0, 'content': 1.5, 'marketing': 1.5, 'strategy': 1.3, 'keyword': 1.8,
  'link': 1.6, 'internal': 1.7, 'external': 1.4, 'backlink': 1.8, 'anchor': 1.5,
  'optimization': 1.6, 'search': 1.4, 'engine': 1.3, 'google': 1.5, 'ranking': 1.7,
  'traffic': 1.5, 'organic': 1.6, 'page': 1.2, 'blog': 1.3, 'article': 1.3,
  'post': 1.2, 'guide': 1.4, 'tutorial': 1.3, 'tips': 1.2, 'cluster': 1.8,
  'topic': 1.5, 'authority': 1.6, 'audit': 1.5, 'checklist': 1.4, 'tools': 1.3,
  'research': 1.4, 'analysis': 1.4, 'improve': 1.3, 'create': 1.2
};

export interface LinkOpportunity {
  url: string;
  score: number;
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

// Extract keywords from URL slug (remains unigram-based for simplicity)
function extractSlugKeywords(url: string): string[] {
  const slug = url
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/\.[a-z]+$/, '')
    .toLowerCase();

  return slug
    .split(/[-_/]+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word) && !isUrlLike(word));
}

// Calculate weighted keyword frequency
function getWeightedKeywords(keywords: Map<string, number>): Map<string, number> {
  const weighted = new Map<string, number>();

  keywords.forEach((count, word) => {
    let weight = SEO_TERM_WEIGHTS[word] || 1.0;

    // Slight bonus for specific multi-word phrases (bigrams/trigrams)
    if (word.includes(' ')) {
      const wordCount = word.split(' ').length;
      weight *= (1.0 + wordCount * 0.2); // 1.4x for bigrams, 1.6x for trigrams
    }

    weighted.set(word, count * weight);
  });

  return weighted;
}

// Calculate relevance score between slug keywords and article keywords
function calculateRelevance(
  slugKeywords: string[],
  articleKeywords: Map<string, number>,
  articleText: string,
  excludedKeywords: string[] = []
): { score: number; matchedKeywords: string[]; explanation: string } {
  if (slugKeywords.length === 0) {
    return { score: 0, matchedKeywords: [], explanation: 'No identifiable keywords in URL' };
  }

  const excludedSet = new Set(excludedKeywords.map(k => k.toLowerCase()));
  const weightedArticle = getWeightedKeywords(articleKeywords);
  const matchedKeywords: string[] = [];
  let totalScore = 0;
  let matchDetails: string[] = [];

  // Check for exact matches
  slugKeywords.forEach(slugWord => {
    const lowerSlug = slugWord.toLowerCase();
    if (excludedSet.has(lowerSlug)) return;

    if (weightedArticle.has(slugWord)) {
      matchedKeywords.push(slugWord);
      const frequency = weightedArticle.get(slugWord)!;
      const weight = SEO_TERM_WEIGHTS[slugWord] || 1.0;
      totalScore += Math.min(frequency * weight * 5, 25);
      matchDetails.push(`"${slugWord}"`);
    }
  });

  // Check for partial/compound matches
  slugKeywords.forEach(slugWord => {
    const lowerSlug = slugWord.toLowerCase();
    if (excludedSet.has(lowerSlug)) return;

    weightedArticle.forEach((freq, articleWord) => {
      const lowerArticle = articleWord.toLowerCase();
      if (excludedSet.has(lowerArticle)) return;

      if (!matchedKeywords.includes(lowerArticle)) {
        if (articleWord.includes(slugWord) || slugWord.includes(articleWord)) {
          matchedKeywords.push(articleWord);
          totalScore += Math.min(freq * 3, 15);
        }
      }
    });
  });

  // Check for phrase presence in article - skip if phrase contains an excluded word
  const slugPhrase = slugKeywords.join(' ');
  const containsExcluded = slugKeywords.some(k => excludedSet.has(k.toLowerCase()));

  if (!containsExcluded && articleText.toLowerCase().includes(slugPhrase)) {
    totalScore += 20;
    matchDetails.push(`the phrase "${slugPhrase}"`);
  }

  // Normalize score to 0-100
  const maxPossibleScore = slugKeywords.length * 25 + 20;
  const normalizedScore = Math.round(Math.min((totalScore / maxPossibleScore) * 100, 100));

  // Generate explanation
  let explanation = '';
  if (normalizedScore >= 85) {
    explanation = `Strong match on ${matchDetails.slice(0, 2).join(' and ')} and related concepts in the body text.`;
  } else if (normalizedScore >= 70) {
    explanation = `Direct mention of ${matchDetails.slice(0, 2).join(', ')} and related terms in the article.`;
  } else if (normalizedScore >= 50) {
    explanation = `Topic clustering aligns with the main theme of ${matchedKeywords.slice(0, 2).join(', ')}.`;
  } else if (normalizedScore >= 30) {
    explanation = `Partial relevance through related concepts: ${matchedKeywords.slice(0, 2).join(', ')}.`;
  } else if (matchedKeywords.length > 0) {
    explanation = `Weak match with limited keyword overlap.`;
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

  const topArticleKeywords = Array.from(articleKeywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  const allMatchedKeywords = new Set<string>();

  // Analyze each URL
  const opportunities: LinkOpportunity[] = urls
    .filter(url => url.trim().length > 0)
    .map(url => {
      const slugKeywords = extractSlugKeywords(url);
      const { score, matchedKeywords, explanation } = calculateRelevance(
        slugKeywords,
        articleKeywords, // Pass the full filtered articleKeywords map
        articleContent,
        excludedKeywords
      );

      matchedKeywords.forEach(k => allMatchedKeywords.add(k));

      return {
        url: url.trim(),
        score,
        explanation,
        matchedKeywords,
        slugKeywords
      };
    });

  // Combine top keywords with all keywords that actually generated matches
  const combinedKeywords = Array.from(new Set([
    ...topArticleKeywords,
    ...Array.from(allMatchedKeywords)
  ])).sort();

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
