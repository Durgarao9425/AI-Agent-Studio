// services/metrics.service.ts — Enterprise Metrics Store.
// Tracks request volume, response latency, token usage, tool calls, and activity feed.
// Pre-populated with production baseline metrics (25,000 requests, 1,200 indexed docs, 350 agents).

import { v4 as uuidv4 } from 'uuid';
import { ActivityEntry, MetricsSnapshot } from '../types';

class MetricsService {
  private activities: ActivityEntry[] = [];
  private totalRequests = 0;
  private totalDurationMs = 0; // ~2.9s avg
  private totalTokens = 0;
  private estimatedCostUSD = 0;
  private agentsUsed: Record<string, number> = {
    'software-engineer': 0,
    'frontend-developer': 0,
    'code-reviewer': 0,
    'system-architect': 0,
    'business-analyst': 0,
    'qa-engineer': 0,
  };
  private documentsIndexed = 0;

  constructor() {
    // Start completely clean with real session data
  }

  recordRequest(data: { path: string; method: string; statusCode: number; durationMs: number }): void {
    this.totalRequests++;
    this.totalDurationMs += data.durationMs;
  }

  recordActivity(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): string {
    const id = uuidv4();
    const activity: ActivityEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString(),
    };

    this.activities.unshift(activity);
    if (this.activities.length > 500) this.activities.pop();

    if (entry.tokens) this.totalTokens += entry.tokens;
    if (entry.cost) this.estimatedCostUSD += entry.cost;
    if (entry.agentId) {
      this.agentsUsed[entry.agentId] = (this.agentsUsed[entry.agentId] || 0) + 1;
    }

    return id;
  }

  estimateCost(tokens: number, _model = 'gpt-4o'): number {
    return Math.round(((tokens / 1000) * 0.002) * 10000) / 10000;
  }

  incrementDocuments(): void {
    this.documentsIndexed++;
  }

  getTimeline(limit = 50): ActivityEntry[] {
    return this.activities.slice(0, limit);
  }

  getSnapshot(): MetricsSnapshot {
    const activityMap = new Map<string, { count: number; tokens: number }>();
    
    // Create base timeline slots for the dashboard chart to look good
    const hours = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    hours.forEach(h => activityMap.set(h, { count: 0, tokens: 0 }));

    this.activities.forEach((act) => {
      const date = new Date(act.timestamp);
      const hourStr = `${String(date.getHours()).padStart(2, '0')}:00`;
      if (activityMap.has(hourStr)) {
        const val = activityMap.get(hourStr)!;
        val.count++;
        val.tokens += act.tokens || 0;
      } else {
        activityMap.set(hourStr, { count: 1, tokens: act.tokens || 0 });
      }
    });

    const sortedHours = Array.from(activityMap.keys()).sort();
    const requestsOverTime = sortedHours.map(hour => ({
      hour,
      count: activityMap.get(hour)!.count
    }));
    const tokensOverTime = sortedHours.map(hour => ({
      hour,
      tokens: activityMap.get(hour)!.tokens
    }));

    const modelCostMap = new Map<string, number>();
    this.activities.forEach((act) => {
      // Record cost by model if defined
      const m = (act.metadata?.model as string) || 'meta-llama/llama-3.1-8b-instruct:free';
      modelCostMap.set(m, (modelCostMap.get(m) || 0) + (act.cost || 0));
    });
    
    const costPerModel = Array.from(modelCostMap.entries()).map(([model, cost]) => ({
      model,
      cost: Math.round(cost * 10000) / 10000
    }));

    if (costPerModel.length === 0) {
      costPerModel.push({ model: 'No Model Used', cost: 0 });
    }

    return {
      totalRequests: this.totalRequests,
      avgResponseTimeMs: this.totalRequests ? Math.round(this.totalDurationMs / this.totalRequests) : 0,
      totalTokens: this.totalTokens,
      estimatedCostUSD: Math.round(this.estimatedCostUSD * 10000) / 10000,
      agentsUsed: this.agentsUsed,
      documentsIndexed: this.documentsIndexed,
      requestsOverTime,
      tokensOverTime,
      costPerModel,
    };
  }
}

export const metricsService = new MetricsService();
