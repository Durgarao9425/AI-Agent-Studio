// services/tools.service.ts — Tool executor implementations.
// Each function here corresponds to an OpenAI function calling schema.
// When OpenAI selects a tool, these functions run the actual logic.

import { evaluate } from 'mathjs';

export interface ToolResult {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  error?: string;
}

/**
 * Evaluates a mathematical expression using mathjs.
 * Safer than eval() — mathjs has a sandboxed expression parser.
 */
export function runCalculator(args: { expression: string }): ToolResult {
  try {
    const result = evaluate(args.expression);
    return {
      toolName: 'calculator',
      input: args,
      output: {
        expression: args.expression,
        result: typeof result === 'number' ? result : result.toString(),
        formatted: `${args.expression} = ${result}`,
      },
    };
  } catch (e) {
    return {
      toolName: 'calculator',
      input: args,
      output: null,
      error: `Invalid expression: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * Returns current date/time in the requested timezone.
 */
export function runCurrentTime(args: { timezone?: string }): ToolResult {
  const timezone = args.timezone || 'UTC';
  try {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'long',
    });
    return {
      toolName: 'current_time',
      input: args,
      output: {
        iso: now.toISOString(),
        timezone,
        formatted,
        unixTimestamp: Math.floor(now.getTime() / 1000),
      },
    };
  } catch {
    return {
      toolName: 'current_time',
      input: args,
      output: null,
      error: `Invalid timezone: ${timezone}`,
    };
  }
}

/**
 * Parses and reformats JSON with configurable indentation.
 * Returns validation status and any parse errors.
 */
export function runJsonFormatter(args: { json_string: string; indent?: number }): ToolResult {
  try {
    const parsed = JSON.parse(args.json_string);
    const indent = args.indent ?? 2;
    const formatted = JSON.stringify(parsed, null, indent);
    const lines = formatted.split('\n').length;
    const keys = Object.keys(typeof parsed === 'object' && parsed !== null ? parsed : {});
    return {
      toolName: 'json_formatter',
      input: args,
      output: {
        valid: true,
        formatted,
        stats: {
          lines,
          topLevelKeys: keys.length,
          type: Array.isArray(parsed) ? 'array' : typeof parsed,
        },
      },
    };
  } catch (e) {
    return {
      toolName: 'json_formatter',
      input: args,
      output: { valid: false, formatted: null },
      error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * Regex generator — generates a regex pattern from a description
 * and tests it against provided sample strings.
 * The actual LLM call for regex generation happens in tools.service to keep
 * this handler pure; here we just build a well-known pattern library
 * for common cases, and the route falls back to LLM for unknown ones.
 */
export function runRegexGenerator(args: {
  description: string;
  test_strings?: string[];
}): ToolResult {
  // Pre-built patterns for common use cases (no LLM needed)
  const patterns: Record<string, { pattern: string; flags: string }> = {
    email: { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', flags: 'i' },
    phone: { pattern: '^[+]?[(]?[0-9]{1,4}[)]?[-\\s./0-9]{7,14}$', flags: '' },
    url: {
      pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_+.~#?&/=]*)',
      flags: 'i',
    },
    'ip address': {
      pattern:
        '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
      flags: '',
    },
    uuid: {
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
      flags: 'i',
    },
    date: { pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$', flags: '' },
    'credit card': { pattern: '^[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}$', flags: '' },
    'hex color': { pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', flags: '' },
  };

  const key = Object.keys(patterns).find((k) =>
    args.description.toLowerCase().includes(k)
  );

  const matched = key ? patterns[key] : { pattern: '.*', flags: '' };

  // Test the pattern against provided strings
  let testResults: Array<{ string: string; matches: boolean }> = [];
  if (args.test_strings && args.test_strings.length > 0) {
    const regex = new RegExp(matched.pattern, matched.flags);
    testResults = args.test_strings.map((s) => ({ string: s, matches: regex.test(s) }));
  }

  return {
    toolName: 'regex_generator',
    input: args,
    output: {
      pattern: matched.pattern,
      flags: matched.flags,
      fullRegex: `/${matched.pattern}/${matched.flags}`,
      description: args.description,
      testResults,
    },
  };
}

/**
 * SQL generator stub — returns a template SQL string.
 * The route handler calls OpenAI with the description to get real SQL.
 * This function is called AFTER the LLM generates the SQL, to wrap the result.
 */
export function runSqlGenerator(args: {
  description: string;
  dialect?: string;
  generated_sql: string;
}): ToolResult {
  return {
    toolName: 'sql_generator',
    input: { description: args.description, dialect: args.dialect || 'postgresql' },
    output: {
      sql: args.generated_sql,
      dialect: args.dialect || 'postgresql',
      description: args.description,
    },
  };
}

// Email, JS, React, and API docs generators are handled entirely by LLM responses
// Their ToolResult wrappers are created in the tools route after LLM completes.
