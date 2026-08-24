import { dbLayer } from "./db";

export interface Memory {
  id: string;
  text: string;
  embedding?: string | number[];
  createdAt: number;
  score?: number;
}

class VectorStore {
  /**
   * Generates a fast 64-dimensional semantic embedding vector using n-gram hashing & term frequency.
   * Runs locally with zero native dependencies or latency.
   */
  public generateEmbedding(text: string): number[] {
    const vector = new Array(64).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const words = cleaned.split(/\s+/).filter(Boolean);

    // Unigrams and bigrams
    const tokens: string[] = [...words];
    for (let i = 0; i < words.length - 1; i++) {
      tokens.push(`${words[i]}_${words[i + 1]}`);
    }

    for (const token of tokens) {
      let hash = 5381;
      for (let i = 0; i < token.length; i++) {
        hash = (hash * 33) ^ token.charCodeAt(i);
      }
      const index = Math.abs(hash) % 64;
      const weight = token.includes("_") ? 1.5 : 1.0;
      vector[index] += weight;
    }

    // L2 normalize
    const norm = Math.sqrt(vector.reduce((sum: number, val: number) => sum + val * val, 0));
    return vector.map((v: number) => v / (norm || 1));
  }

  public cosineSimilarity(v1: number[], v2: number[]): number {
    if (!v1 || !v2 || v1.length !== v2.length || v1.length === 0) return 0;
    let dot = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }
    const mag = Math.sqrt(mag1) * Math.sqrt(mag2);
    return mag ? dot / mag : 0;
  }

  public async add(text: string): Promise<Memory> {
    const embedding = this.generateEmbedding(text);
    const mem: Memory = {
      id: dbLayer.genId(),
      text: text.trim(),
      embedding: JSON.stringify(embedding),
      createdAt: Date.now()
    };
    dbLayer.insert("memory", mem as unknown as Record<string, unknown>);
    return mem;
  }

  public async query(queryText: string, k = 3): Promise<Memory[]> {
    const queryEmbedding = this.generateEmbedding(queryText);
    const all = (dbLayer.all("memory") as unknown as Memory[]) || [];

    if (all.length === 0) return [];

    const scored = all.map((mem) => {
      let emb: number[] = [];
      try {
        emb = typeof mem.embedding === "string" ? JSON.parse(mem.embedding) : mem.embedding || [];
      } catch {
        emb = this.generateEmbedding(mem.text);
      }

      const sim = this.cosineSimilarity(queryEmbedding, emb);
      // Add lexical boost for exact keyword matches
      const lexicalMatches = queryText
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3 && mem.text.toLowerCase().includes(w)).length;
      const totalScore = sim + lexicalMatches * 0.2;

      return { ...mem, score: totalScore };
    });

    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return scored.slice(0, k);
  }

  public async getAll(): Promise<Memory[]> {
    return (dbLayer.all("memory") as unknown as Memory[]) || [];
  }
}

export const vectorStore = new VectorStore();
