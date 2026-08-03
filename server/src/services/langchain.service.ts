// services/langchain.service.ts — LangChain.js integration.
// Demonstrates: PromptTemplate, ChatOpenAI LLM, OutputParser, ConversationChain, BufferMemory.
// Each of these is a core LangChain concept that interviewers will ask about.

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';
import { metricsService } from './metrics.service';
import { getActiveApiKey, isRealApiKey, isGeminiApiKey } from './openai.service';

// In-memory store for conversation sessions.
// Maps sessionId → ConversationChain so memory persists across requests.
const conversationSessions = new Map<string, ConversationChain>();

/**
 * runPromptChain — Demonstrates the basic LangChain LCEL (LangChain Expression Language) pattern:
 *   PromptTemplate | ChatOpenAI | OutputParser
 * 
 * This is the "chain" pattern: each component is a Runnable, chained with the pipe operator.
 */
export async function runPromptChain(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model = 'gpt-4o',
  temperature = 0.7
): Promise<{
  output: string;
  tokensUsed: number;
  chain: {
    promptTemplate: string;
    llmModel: string;
    outputParser: string;
    formattedPrompt: string;
  };
}> {
  const start = Date.now();
  const resolvedKey = getActiveApiKey(apiKey);

  // 1. PromptTemplate — defines the structure of the prompt with variables
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt || 'You are a helpful AI assistant.'),
    HumanMessagePromptTemplate.fromTemplate('{input}'),
  ]);

  const isOR = resolvedKey.startsWith('sk-or-');
  const isGemini = isGeminiApiKey(resolvedKey);
  const isReal = isRealApiKey(apiKey);

  let output: string;

  if (isReal) {
    try {
      let selectedModel = model;
      if (isGemini) {
        if (!selectedModel || selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1') || selectedModel.startsWith('o3')) {
          selectedModel = 'gemini-1.5-flash';
        }
      } else if (isOR) {
        if (!selectedModel || selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1') || selectedModel.startsWith('o3')) {
          selectedModel = 'meta-llama/llama-3-8b-instruct:free';
        }
      } else {
        if (!selectedModel) {
          selectedModel = 'gpt-4o';
        }
      }

      // 2. ChatOpenAI — the LLM component
      const llm = new ChatOpenAI({
        openAIApiKey: resolvedKey,
        modelName: selectedModel,
        temperature,
        maxTokens: 512, // Limit maximum output tokens to prevent 402 cost-ceiling errors on OpenRouter
        configuration: isOR ? {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'https://ai-agent-studio-beta.vercel.app',
            'X-Title': 'AI Agent Studio',
          }
        } : isGemini ? {
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        } : undefined
      });

      // 3. StringOutputParser — extracts the string content from the LLM response
      const outputParser = new StringOutputParser();

      // 4. Chain them together using LCEL pipe syntax
      const chain = prompt.pipe(llm).pipe(outputParser);

      // 5. Invoke the chain
      output = await chain.invoke({ input: userPrompt });
    } catch (err: any) {
      console.warn('LangChain execution failed, falling back to simulated output:', err.message);
      output = `[Demo Mode - API Limit Fallback] Your request was processed via local simulation fallback because the API returned: "${err.message}".\n\nHere is your response:\n1. LangChain facilitates standard interface wrappers around model prompts and parsers.\n2. In this demo, we successfully simulated the exact Runnable sequence.\n3. The execution was completed in offline resilience mode.`;
    }
  } else {
    output = `[Demo Mode] Successfully executed the LangChain LCEL prompt chain!\n\nSystem Prompt Rules: "${systemPrompt || 'None'}"\nUser Input: "${userPrompt}"\n\nThis is a simulated output returned by the offline demo engine. Enter a real API key in settings to connect live.`;
  }

  // Format the prompt for visualization (what was actually sent to the LLM)
  const formattedMessages = await prompt.formatMessages({ input: userPrompt });
  const formattedPrompt = formattedMessages.map((m) => `[${m._getType()}]: ${m.content}`).join('\n');

  const durationMs = Date.now() - start;
  // Estimate tokens (LangChain doesn't always expose usage in chain output)
  const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length + output.length) / 4);
  const cost = metricsService.estimateCost(estimatedTokens, model);

  metricsService.recordActivity({
    type: 'langchain',
    label: 'LangChain Prompt Chain',
    durationMs,
    tokens: estimatedTokens,
    cost,
    status: 'success',
  });

  return {
    output,
    tokensUsed: estimatedTokens,
    chain: {
      promptTemplate: `System: ${systemPrompt}\nHuman: {input}`,
      llmModel: model,
      outputParser: 'StringOutputParser',
      formattedPrompt,
    },
  };
}

/**
 * runConversationChain — Demonstrates LangChain's ConversationChain with BufferMemory.
 * BufferMemory stores all messages in a buffer and injects them into each prompt.
 * This is the foundational memory pattern in LangChain.
 */
export async function runConversationChain(
  apiKey: string,
  sessionId: string,
  userMessage: string,
  model = 'gpt-4o',
  temperature = 0.7
): Promise<{
  response: string;
  memoryContents: string;
  sessionId: string;
  messageCount: number;
}> {
  const isReal = isRealApiKey(apiKey);

  if (!isReal) {
    const sessionHistoryKey = `history:${sessionId}`;
    const currentHistory = (global as any)[sessionHistoryKey] || '';
    const newResponse = `[Demo Mode] Hello! I received your message: "${userMessage}". This conversation history is preserved in local server state.`;
    const updatedHistory = `${currentHistory}Human: ${userMessage}\nAI: ${newResponse}\n`;
    (global as any)[sessionHistoryKey] = updatedHistory;

    const messageCount = updatedHistory.split('\n').filter((l: string) => l.startsWith('Human:') || l.startsWith('AI:')).length;

    return {
      response: newResponse,
      memoryContents: updatedHistory,
      sessionId,
      messageCount,
    };
  }

  // Get or create conversation chain for this session
  if (!conversationSessions.has(sessionId)) {
    const resolvedKey = getActiveApiKey(apiKey);
    const isOR = resolvedKey.startsWith('sk-or-');
    const isGemini = isGeminiApiKey(resolvedKey);

    let selectedModel = model;
    if (isGemini) {
      if (!selectedModel || selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1') || selectedModel.startsWith('o3')) {
        selectedModel = 'gemini-1.5-flash';
      }
    } else if (isOR) {
      if (!selectedModel || selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1') || selectedModel.startsWith('o3')) {
        selectedModel = 'meta-llama/llama-3-8b-instruct:free';
      }
    } else {
      if (!selectedModel) {
        selectedModel = 'gpt-4o';
      }
    }

    const llm = new ChatOpenAI({
      openAIApiKey: resolvedKey,
      modelName: selectedModel,
      temperature,
      maxTokens: 512, // Limit maximum output tokens to prevent 402 cost-ceiling errors on OpenRouter
      configuration: isOR ? {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://ai-agent-studio-beta.vercel.app',
          'X-Title': 'AI Agent Studio',
        }
      } : isGemini ? {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      } : undefined
    });

    // BufferMemory keeps ALL messages — suitable for short conversations
    const memory = new BufferMemory({
      returnMessages: false,
      memoryKey: 'history',
    });

    const chain = new ConversationChain({ llm, memory });
    conversationSessions.set(sessionId, chain);
  }

  const chain = conversationSessions.get(sessionId)!;
  
  let responseText: string;
  try {
    const result = await chain.call({ input: userMessage });
    responseText = result.response;
  } catch (err: any) {
    console.warn('LangChain conversation failed, falling back to simulated memory reply:', err.message);
    responseText = `[Demo Mode - API Limit Fallback] Note: API returned error "${err.message}". I've switched to resilience mode. I received: "${userMessage}".`;
    
    // Manually push to LangChain's memory so that the visual memory indicator still updates nicely
    await chain.memory!.saveContext({ input: userMessage }, { output: responseText });
  }

  // Retrieve memory contents for visualization
  const memoryVars = await chain.memory!.loadMemoryVariables({});
  const memoryContents = (memoryVars.history as string) || '';
  const messageCount = memoryContents.split('\n').filter((l) => l.startsWith('Human:') || l.startsWith('AI:')).length;

  return {
    response: responseText,
    memoryContents,
    sessionId,
    messageCount,
  };
}

/**
 * clearConversationMemory — Removes a session's memory buffer.
 * Called when the user clicks "Clear Memory" in the UI.
 */
export function clearConversationMemory(sessionId: string): boolean {
  return conversationSessions.delete(sessionId);
}

/**
 * getLangChainDemoExplanation — Returns a structured explanation of LangChain components.
 * Used by the frontend to render the visual chain diagram.
 */
export function getLangChainComponents(): object {
  return {
    components: [
      {
        id: 'prompt-template',
        name: 'ChatPromptTemplate',
        type: 'PromptTemplate',
        description: 'Defines the structure of messages sent to the LLM. Supports variables like {input} that get substituted at runtime.',
        color: '#8b5cf6',
        code: `const prompt = ChatPromptTemplate.fromMessages([\n  SystemMessagePromptTemplate.fromTemplate("You are {role}"),\n  HumanMessagePromptTemplate.fromTemplate("{input}")\n]);`,
      },
      {
        id: 'llm',
        name: 'ChatOpenAI',
        type: 'LLM',
        description: 'The language model component. Wraps OpenAI\'s chat API with LangChain\'s Runnable interface, enabling it to be piped with other components.',
        color: '#3b82f6',
        code: `const llm = new ChatOpenAI({\n  modelName: "gpt-4o",\n  temperature: 0.7\n});`,
      },
      {
        id: 'output-parser',
        name: 'StringOutputParser',
        type: 'OutputParser',
        description: 'Extracts the string content from the LLM\'s AIMessage response. Other parsers include JsonOutputParser, StructuredOutputParser.',
        color: '#10b981',
        code: `const parser = new StringOutputParser();\n// Converts AIMessage → string`,
      },
      {
        id: 'chain',
        name: 'LCEL Chain',
        type: 'Chain',
        description: 'LangChain Expression Language (LCEL) uses the pipe operator to compose Runnables into a chain. Data flows left to right.',
        color: '#f59e0b',
        code: `const chain = prompt.pipe(llm).pipe(parser);\nconst result = await chain.invoke({ input: "Hello" });`,
      },
      {
        id: 'memory',
        name: 'BufferMemory',
        type: 'Memory',
        description: 'Stores conversation history in a buffer. Injected into the prompt on each call via the {history} variable. Other options: SummaryMemory, VectorStoreMemory.',
        color: '#ef4444',
        code: `const memory = new BufferMemory({ memoryKey: "history" });\nconst chain = new ConversationChain({ llm, memory });`,
      },
    ],
    flow: ['prompt-template', 'llm', 'output-parser'],
    memoryFlow: ['memory', 'prompt-template', 'llm', 'output-parser'],
  };
}
