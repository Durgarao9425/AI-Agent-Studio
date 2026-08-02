// types/knowledge.ts — TypeScript interface for Knowledge Base entries

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'frontend' | 'backend' | 'ai_ml' | 'devops_cloud' | 'system_design' | 'enterprise_apps';
  keywords: string[];
  description: string;
  detailedExplanation: string;
  architectureFlow?: string;
  examples: string[];
  interviewQuestions: Array<{
    question: string;
    answer: string;
  }>;
  sampleCode: string;
  bestPractices: string[];
  commonMistakes: string[];
  references: string[];
  tags: string[];
}

export interface SearchResult {
  item: KnowledgeItem;
  score: number;
  matchedKeywords: string[];
  highlightedSnippet: string;
}

export interface RAGSynthesisResult {
  answer: string;
  retrievedDocs: SearchResult[];
  augmentedPrompt: string;
  rankingScores: Array<{ title: string; score: number }>;
  tokensUsed: number;
}
