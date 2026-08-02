// tools/definitions.ts — OpenAI Function Calling tool schemas.
// These schemas are sent to OpenAI so it knows which tools are available
// and what parameters each tool expects. The actual execution happens in tools.service.ts.

import OpenAI from 'openai';

export const TOOL_SCHEMAS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'calculator',
      description:
        'Evaluate mathematical expressions and perform calculations. Supports arithmetic, algebra, trigonometry, and statistics.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'The mathematical expression to evaluate, e.g. "2 + 2 * 8" or "sqrt(144)"',
          },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'current_time',
      description: 'Get the current date and time in a specified timezone.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'IANA timezone string, e.g. "America/New_York" or "Asia/Kolkata"',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'json_formatter',
      description: 'Parse, validate, and format a JSON string with proper indentation.',
      parameters: {
        type: 'object',
        properties: {
          json_string: {
            type: 'string',
            description: 'The JSON string to format and validate',
          },
          indent: {
            type: 'number',
            description: 'Number of spaces for indentation (default: 2)',
          },
        },
        required: ['json_string'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'regex_generator',
      description:
        'Generate a regular expression pattern for a given use case description and test it against sample strings.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description:
              'Natural language description of what the regex should match, e.g. "email addresses"',
          },
          test_strings: {
            type: 'array',
            items: { type: 'string' },
            description: 'Sample strings to test the generated regex against',
          },
        },
        required: ['description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sql_generator',
      description:
        'Generate SQL queries from natural language descriptions. Supports SELECT, INSERT, UPDATE, DELETE, and complex JOINs.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description:
              'Natural language description of what SQL query to generate, e.g. "Get all users who signed up in the last 30 days"',
          },
          dialect: {
            type: 'string',
            enum: ['postgresql', 'mysql', 'sqlite', 'mssql'],
            description: 'SQL dialect to use (default: postgresql)',
          },
          schema: {
            type: 'string',
            description: 'Optional table schema to reference in the query',
          },
        },
        required: ['description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'email_generator',
      description:
        'Generate a professional email based on the given context, tone, and requirements.',
      parameters: {
        type: 'object',
        properties: {
          purpose: {
            type: 'string',
            description:
              'The purpose of the email, e.g. "follow up on job application" or "request a meeting"',
          },
          tone: {
            type: 'string',
            enum: ['formal', 'semi-formal', 'friendly', 'assertive'],
            description: 'The tone of the email',
          },
          key_points: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key points to include in the email body',
          },
          recipient_name: {
            type: 'string',
            description: 'Name of the email recipient',
          },
          sender_name: {
            type: 'string',
            description: 'Name of the email sender',
          },
        },
        required: ['purpose'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'javascript_generator',
      description: 'Generate clean, modern JavaScript/TypeScript code snippets or utilities.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'What the JavaScript code should do',
          },
          language: {
            type: 'string',
            enum: ['javascript', 'typescript'],
            description: 'Language to generate (default: typescript)',
          },
          include_tests: {
            type: 'boolean',
            description: 'Whether to include unit tests (default: false)',
          },
        },
        required: ['description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'react_component_generator',
      description:
        'Generate a complete, production-ready React component with TypeScript and Tailwind CSS.',
      parameters: {
        type: 'object',
        properties: {
          component_name: {
            type: 'string',
            description: 'Name of the React component to generate',
          },
          description: {
            type: 'string',
            description: 'What the component should do and how it should look',
          },
          props: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                required: { type: 'boolean' },
              },
            },
            description: 'Props the component should accept',
          },
          include_storybook: {
            type: 'boolean',
            description: 'Whether to include a Storybook story',
          },
        },
        required: ['component_name', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'api_docs_generator',
      description: 'Generate OpenAPI/Swagger documentation for a REST API endpoint.',
      parameters: {
        type: 'object',
        properties: {
          endpoint: {
            type: 'string',
            description: 'The API endpoint path, e.g. "/api/users/{id}"',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            description: 'HTTP method',
          },
          description: {
            type: 'string',
            description: 'What this endpoint does',
          },
          request_body: {
            type: 'string',
            description: 'Description of the request body schema',
          },
          response: {
            type: 'string',
            description: 'Description of the response schema',
          },
        },
        required: ['endpoint', 'method', 'description'],
      },
    },
  },
];

export const TOOL_INFO = TOOL_SCHEMAS.map((t) => ({
  name: t.function.name,
  description: t.function.description,
}));
