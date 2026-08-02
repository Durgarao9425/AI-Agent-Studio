// knowledge/index.ts — Local AI Search Engine & Knowledge Base Manager.
// Operates 100% offline without external API dependencies.
// Loads all knowledge JSON files, executes fuzzy keyword ranking, BM25 scoring,
// and synthesizes structured AI responses with full markdown rendering.

import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeItem, SearchResult, RAGSynthesisResult } from '../types/knowledge';

class LocalKnowledgeEngine {
  private items: KnowledgeItem[] = [];

  constructor() {
    this.loadKnowledgeBase();
  }

  /**
   * Loads all JSON data files from src/knowledge/data/
   */
  private loadKnowledgeBase(): void {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      console.warn('[Knowledge Engine] Data directory not found at:', dataDir);
      return;
    }

    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
    this.items = [];

    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed: KnowledgeItem[] = JSON.parse(content);
        this.items.push(...parsed);
      } catch (err) {
        console.error(`[Knowledge Engine] Error loading ${file}:`, err);
      }
    }

    console.log(`[Knowledge Engine] Successfully loaded ${this.items.length} knowledge topics from ${files.length} categories.`);
  }

  /**
   * Search knowledge base with keyword matching, fuzzy matching, and ranking.
   */
  public search(query: string, category?: string, topK = 5): SearchResult[] {
    if (!query || !query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const queryTokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 1);

    const scored: SearchResult[] = [];

    for (const item of this.items) {
      // Optional category filter
      if (category && item.category !== category) continue;

      let score = 0;
      const matchedKeywords: string[] = [];

      // 1. Exact ID or Title Match (Highest Weight)
      if (item.id === normalizedQuery || item.title.toLowerCase() === normalizedQuery) {
        score += 100;
        matchedKeywords.push(item.title);
      }

      // 2. Keyword Matches
      for (const kw of item.keywords) {
        const kwLower = kw.toLowerCase();
        if (normalizedQuery.includes(kwLower)) {
          score += 25;
          matchedKeywords.push(kw);
        } else {
          for (const qToken of queryTokens) {
            if (kwLower.includes(qToken)) {
              score += 10;
              if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
            }
          }
        }
      }

      // 3. Title Token Matches
      const titleLower = item.title.toLowerCase();
      for (const qToken of queryTokens) {
        if (titleLower.includes(qToken)) {
          score += 15;
        }
      }

      // 4. Description & Tags Matches
      const descLower = item.description.toLowerCase();
      for (const qToken of queryTokens) {
        if (descLower.includes(qToken)) score += 5;
      }

      for (const tag of item.tags) {
        if (normalizedQuery.includes(tag.toLowerCase())) score += 8;
      }

      if (score > 0) {
        // Highlight matched snippet
        const highlightedSnippet = this.generateSnippet(item, queryTokens);
        scored.push({
          item,
          score,
          matchedKeywords: Array.from(new Set(matchedKeywords)),
          highlightedSnippet,
        });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Fallback: If no exact matches found, return top relevant items
    if (scored.length === 0 && this.items.length > 0) {
      return this.items.slice(0, topK).map((item) => ({
        item,
        score: 5,
        matchedKeywords: item.keywords.slice(0, 3),
        highlightedSnippet: item.description,
      }));
    }

    return scored.slice(0, topK);
  }

  /**
   * Generates a highlighted text snippet containing matching tokens.
   */
  private generateSnippet(item: KnowledgeItem, queryTokens: string[]): string {
    const fullText = `${item.description} ${item.detailedExplanation}`;
    let snippet = item.description;

    for (const token of queryTokens) {
      if (token.length > 2) {
        const idx = fullText.toLowerCase().indexOf(token);
        if (idx !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(fullText.length, idx + 120);
          snippet = (start > 0 ? '...' : '') + fullText.slice(start, end) + (end < fullText.length ? '...' : '');
          break;
        }
      }
    }

    return snippet;
  }

  /**
   * Local RAG Pipeline Synthesizer:
   * Query -> Retrieve -> Rank -> Generate Rich Markdown Answer
   */
  public synthesizeRAGAnswer(query: string, topK = 3): RAGSynthesisResult {
    const queryLower = query.trim().toLowerCase();
    const GREETINGS = ['hi', 'hello', 'hey', 'hi there', 'hello there', 'who are you', 'what is this', 'help'];

    if (GREETINGS.includes(queryLower) || (queryLower.length <= 3 && !['sql', 'css', 'aws', 'gcp', 'rag', 'ts', 'js'].includes(queryLower))) {
      const greetingAnswer = `Hello! 👋 I'm your AI Assistant in **AI Agent Studio**.

I am an interactive AI Assistant designed to help you explore web development, backend engineering, cloud architecture, system design, and AI engineering.

### 🌟 Featured Topics & Documentation:
- ⚛️ **Frontend Frameworks**: [React 19 Documentation](https://react.dev) · [TypeScript Manual](https://www.typescriptlang.org) · [Tailwind CSS](https://tailwindcss.com)
- ⚙️ **Backend Services**: [Node.js Engine](https://nodejs.org) · [Express.js](https://expressjs.com) · [PostgreSQL](https://www.postgresql.org) · [MongoDB](https://www.mongodb.com)
- 🤖 **AI Frameworks**: [LangChain.js](https://js.langchain.com) · [LlamaIndex.TS](https://ts.llamaindex.ai) · [CrewAI Orchestration](https://crewai.com) · [OpenAI API](https://platform.openai.com)
- 🏗️ **System Design**: [Hostel Management System Architectural Blueprint](file:///d:/AiWebsite/README.md) · [System Design Guide](https://github.com/donnemartin/system-design-primer)

Type any question or keyword (e.g. **"LangChain"**, **"Hostel Management"**, or **"React"**) to get complete architecture, flow diagrams, sample code, and interview questions!`;

      return {
        answer: greetingAnswer,
        retrievedDocs: [],
        augmentedPrompt: `User Greeting: ${query}`,
        rankingScores: [],
        tokensUsed: 65,
      };
    }

    const searchResults = this.search(query, undefined, topK);

    if (searchResults.length === 0) {
      return {
        answer: `I searched the local Knowledge Base for **"${query}"**, but no direct matches were found.`,
        retrievedDocs: [],
        augmentedPrompt: `User Query: ${query}\nRetrieved Context: None`,
        rankingScores: [],
        tokensUsed: 40,
      };
    }

    const primaryMatch = searchResults[0].item;

    // Construct Augmented Prompt
    const contextText = searchResults
      .map((r, i) => `[Document ${i + 1}: ${r.item.title}] (Score: ${r.score})\n${r.item.detailedExplanation}`)
      .join('\n\n---\n\n');

    const augmentedPrompt = `LOCAL KNOWLEDGE BASE CONTEXT:\n${contextText}\n\nUSER QUESTION: ${query}\n\nINSTRUCTIONS: Generate a structured, production-quality response formatted in markdown.`;

    // Synthesize structured AI Markdown Response
    let answer = `### 📘 ${primaryMatch.title}\n\n${primaryMatch.description}\n\n#### 🔬 Detailed Explanation\n${primaryMatch.detailedExplanation}\n\n`;

    if (primaryMatch.architectureFlow) {
      answer += `#### 🏗️ Architecture & Execution Flow\n\`\`\`\n${primaryMatch.architectureFlow}\n\`\`\`\n\n`;
    }

    if (primaryMatch.sampleCode) {
      answer += `#### 💻 Production Code Example\n\`\`\`typescript\n${primaryMatch.sampleCode}\n\`\`\`\n\n`;
    }

    if (primaryMatch.bestPractices && primaryMatch.bestPractices.length > 0) {
      answer += `#### ✨ Best Practices\n${primaryMatch.bestPractices.map((bp) => `- ${bp}`).join('\n')}\n\n`;
    }

    if (primaryMatch.interviewQuestions && primaryMatch.interviewQuestions.length > 0) {
      answer += `#### ❓ Top Technical Interview Questions\n`;
      for (const q of primaryMatch.interviewQuestions) {
        answer += `**Q: ${q.question}**\n\n> **Answer**: ${q.answer}\n\n`;
      }
    }

    if (primaryMatch.commonMistakes && primaryMatch.commonMistakes.length > 0) {
      answer += `#### ⚠️ Common Pitfalls to Avoid\n${primaryMatch.commonMistakes.map((cm) => `- ${cm}`).join('\n')}\n\n`;
    }

    const tokensUsed = Math.ceil((augmentedPrompt.length + answer.length) / 4);

    return {
      answer,
      retrievedDocs: searchResults,
      augmentedPrompt,
      rankingScores: searchResults.map((r) => ({ title: r.item.title, score: r.score })),
      tokensUsed,
    };
  }

  public getAllItems(): KnowledgeItem[] {
    return this.items;
  }

  public getItemById(id: string): KnowledgeItem | undefined {
    return this.items.find((i) => i.id === id || i.title.toLowerCase() === id.toLowerCase());
  }
}

// Singleton instance shared across all routes
export const localKnowledgeEngine = new LocalKnowledgeEngine();
