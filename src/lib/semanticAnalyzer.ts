import { pipeline, env } from '@xenova/transformers';

// Configuration for transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

class SemanticAnalyzer {
    private static instance: SemanticAnalyzer;
    private extractor: any = null;

    private constructor() { }

    public static getInstance(): SemanticAnalyzer {
        if (!SemanticAnalyzer.instance) {
            SemanticAnalyzer.instance = new SemanticAnalyzer();
        }
        return SemanticAnalyzer.instance;
    }

    public async init() {
        if (this.extractor) return;

        // Using MiniLM as it's small and fast for browser-side inference
        this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        await this.init();
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data) as number[];
    }

    public cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

export const semanticAnalyzer = SemanticAnalyzer.getInstance();
