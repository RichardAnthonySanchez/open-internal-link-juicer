import { useState, useRef, useCallback } from 'react';
import { analyzeInternalLinks, AnalysisResult, LinkOpportunity } from '@/lib/linkAnalyzer';
import { semanticAnalyzer } from '@/lib/semanticAnalyzer';
import { useToast } from '@/hooks/use-toast';

export function useLinkAnalysis() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const { toast } = useToast();

    // Caching refs
    const cachedArticleContent = useRef<string | null>(null);
    const cachedArticleChunks = useRef<string[]>([]);
    const cachedChunkEmbeddings = useRef<number[][]>([]);

    const analyze = useCallback(async (
        articleContent: string,
        sitemapUrls: string,
        mode: 'individual' | 'batch',
        excludedKeywords: string[] = []
    ) => {
        if (!articleContent.trim() || !sitemapUrls.trim()) return;

        setIsAnalyzing(true);

        try {
            const urls = sitemapUrls.split('\n').filter(url => url.trim());

            // 1. Keyword-based analysis (Baseline)
            const analysisResults = analyzeInternalLinks(articleContent, urls, mode, 20, excludedKeywords);

            // 2. Semantic Analysis
            await semanticAnalyzer.init();

            // Check if we need to re-embed the article
            if (articleContent !== cachedArticleContent.current) {
                const chunks = articleContent
                    .split(/\n\n+/)
                    .map(c => c.trim())
                    .filter(c => c.length > 20);

                const embeddings = await Promise.all(
                    chunks.map(chunk => semanticAnalyzer.generateEmbedding(chunk))
                );

                cachedArticleContent.current = articleContent;
                cachedArticleChunks.current = chunks;
                cachedChunkEmbeddings.current = embeddings;
            }

            // Enhance opportunities with semantic scores and highlighting
            const enhancedOpportunities = await Promise.all(
                analysisResults.opportunities.map(async (opportunity) => {
                    const query = opportunity.slugKeywords.join(' ');
                    if (!query) return opportunity;

                    const queryEmbedding = await semanticAnalyzer.generateEmbedding(query);

                    let maxSim = 0;
                    let bestChunkIdx = -1;

                    cachedChunkEmbeddings.current.forEach((chunkEmb, idx) => {
                        const sim = semanticAnalyzer.cosineSimilarity(queryEmbedding, chunkEmb);
                        if (sim > maxSim) {
                            maxSim = sim;
                            bestChunkIdx = idx;
                        }
                    });

                    const semanticScore = Math.round(maxSim * 100);

                    return {
                        ...opportunity,
                        semanticScore,
                        semanticMatch: bestChunkIdx !== -1 ? {
                            score: semanticScore,
                            chunkText: cachedArticleChunks.current[bestChunkIdx],
                            chunkIndex: bestChunkIdx
                        } : undefined,
                        // Score is the max of keyword-based and semantic-based
                        score: Math.min(Math.max(opportunity.score, semanticScore), 100),
                        explanation: maxSim > 0.6
                            ? `Strong semantic match (${semanticScore}%) found in content.`
                            : opportunity.explanation
                    };
                })
            );

            enhancedOpportunities.sort((a, b) => b.score - a.score);
            analysisResults.opportunities = enhancedOpportunities;

            setResults(analysisResults);
        } catch (error) {
            console.error('Analysis failed:', error);
            toast({
                title: "Analysis error",
                description: "There was a problem during semantic analysis.",
                variant: "destructive"
            });
        } finally {
            setIsAnalyzing(false);
        }
    }, [toast]);

    const reset = useCallback(() => {
        setResults(null);
        cachedArticleContent.current = null;
        cachedArticleChunks.current = [];
        cachedChunkEmbeddings.current = [];
    }, []);

    return { analyze, isAnalyzing, results, reset };
}
