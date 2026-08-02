// services/crew.service.ts — Multi-agent sequential pipeline (CrewAI pattern in TypeScript).
// CrewAI in Python is essentially: define agents with role/goal/backstory,
// define tasks, assign tasks to agents, run in sequence with context passing.
// This is an exact TypeScript reimplementation of that pattern.

import { chatCompletion } from './openai.service';
import { metricsService } from './metrics.service';
import { CrewAgent, CrewStep } from '../types';

// ─── Crew Agents (same as CrewAI Python definitions) ─────────────────────────

const CREW_AGENTS: CrewAgent[] = [
  {
    role: 'Business Analyst',
    goal: 'Understand the system requirements and define detailed functional specifications',
    backstory:
      'Expert business analyst with 10 years of experience in software requirement analysis. Translates business needs into clear technical requirements.',
    outputLabel: 'Business Requirements Document (BRD)',
  },
  {
    role: 'System Architect',
    goal: 'Design the overall system architecture, database schema, and technology stack',
    backstory:
      'Senior system architect who has designed scalable enterprise systems. Creates clear architecture diagrams and technical decision records.',
    outputLabel: 'System Architecture Document',
  },
  {
    role: 'Frontend Engineer',
    goal: 'Design the user interface, component structure, and frontend architecture',
    backstory:
      'Experienced frontend engineer specializing in React, TypeScript, and modern UX patterns. Creates detailed component specifications and UI flows.',
    outputLabel: 'Frontend Architecture & UI Specification',
  },
  {
    role: 'Backend Engineer',
    goal: 'Design the API endpoints, business logic, and backend service structure',
    backstory:
      'Backend engineer with expertise in Node.js, PostgreSQL, and RESTful API design. Creates comprehensive API specifications and data models.',
    outputLabel: 'Backend Architecture & API Specification',
  },
  {
    role: 'QA Engineer',
    goal: 'Define the testing strategy, test cases, and quality assurance plan',
    backstory:
      'QA engineer specializing in automated testing, security testing, and performance testing. Creates comprehensive test plans and identifies edge cases.',
    outputLabel: 'QA & Testing Strategy',
  },
];

/**
 * buildSystemPrompt — Constructs the system prompt for each crew agent.
 * This mirrors how CrewAI builds agent contexts.
 */
function buildSystemPrompt(agent: CrewAgent): string {
  return `You are a ${agent.role}.

Your Goal: ${agent.goal}

Your Background: ${agent.backstory}

Important Instructions:
- Be extremely detailed and comprehensive in your output
- Use markdown formatting with headers, bullet points, and code blocks where appropriate
- Build upon the context provided from previous agents
- Your output will be used as input for the next agent in the pipeline
- Label your output clearly as: "${agent.outputLabel}"`;
}

/**
 * buildTaskPrompt — Creates the task prompt for each agent.
 * The previousOutputs array gives each agent full context of what came before.
 * This is equivalent to CrewAI's task context passing mechanism.
 */
function buildTaskPrompt(
  projectDescription: string,
  agent: CrewAgent,
  previousOutputs: Array<{ role: string; output: string }>
): string {
  let prompt = `PROJECT: ${projectDescription}\n\n`;

  if (previousOutputs.length > 0) {
    prompt += `=== CONTEXT FROM PREVIOUS AGENTS ===\n`;
    for (const prev of previousOutputs) {
      prompt += `\n--- ${prev.role} Output ---\n${prev.output}\n`;
    }
    prompt += `\n=== YOUR TASK ===\n`;
  }

  prompt += `As the ${agent.role}, provide your "${agent.outputLabel}" for the project described above.`;
  prompt += previousOutputs.length > 0
    ? ` Build upon the analysis provided by previous agents.`
    : '';

  return prompt;
}

/**
 * runCrew — Executes the full multi-agent pipeline sequentially.
 * Returns an async generator so the route can stream each step as SSE.
 * 
 * Pattern: BusinessAnalyst → Architect → Frontend → Backend → QA
 * Each step receives all previous outputs as context.
 */
export async function* runCrew(
  projectDescription: string,
  apiKey: string,
  model = 'gpt-4o'
): AsyncGenerator<CrewStep & { agentIndex: number; total: number }> {
  const previousOutputs: Array<{ role: string; output: string }> = [];

  for (let i = 0; i < CREW_AGENTS.length; i++) {
    const agent = CREW_AGENTS[i];
    const startTime = Date.now();

    const messages = [
      { role: 'system' as const, content: buildSystemPrompt(agent) },
      {
        role: 'user' as const,
        content: buildTaskPrompt(projectDescription, agent, previousOutputs),
      },
    ];

    const { content, tokensUsed } = await chatCompletion(
      apiKey,
      messages,
      model,
      0.4, // Moderate temperature for creative but consistent output
      3000  // Allow longer responses for comprehensive documentation
    );

    const durationMs = Date.now() - startTime;
    const cost = metricsService.estimateCost(tokensUsed, model);

    metricsService.recordActivity({
      type: 'crew',
      label: `CrewAI: ${agent.role}`,
      durationMs,
      tokens: tokensUsed,
      cost,
      status: 'success',
      metadata: { agentRole: agent.role, project: projectDescription },
    });

    // Store output for next agent's context
    previousOutputs.push({ role: agent.role, output: content });

    const step: CrewStep = {
      agent,
      output: content,
      durationMs,
      tokensUsed,
    };

    yield { ...step, agentIndex: i, total: CREW_AGENTS.length };
  }
}

/**
 * generateProjectSummary — Creates the final executive summary.
 * This is an extra step beyond the 5 agents — a meta-summary of all outputs.
 */
export async function generateProjectSummary(
  projectDescription: string,
  allOutputs: Array<{ role: string; output: string }>,
  apiKey: string,
  model = 'gpt-4o'
): Promise<string> {
  const context = allOutputs.map((o) => `## ${o.role}\n${o.output}`).join('\n\n');

  const { content } = await chatCompletion(
    apiKey,
    [
      {
        role: 'system',
        content:
          'You are a project coordinator creating an executive summary. Be concise, professional, and highlight key decisions made by each agent.',
      },
      {
        role: 'user',
        content: `PROJECT: ${projectDescription}\n\nCreate a comprehensive executive summary based on the following agent outputs:\n\n${context}`,
      },
    ],
    model,
    0.3,
    1500
  );

  return content;
}
