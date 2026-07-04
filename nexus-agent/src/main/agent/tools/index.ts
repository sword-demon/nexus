import type { Messages } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages'

export type ToolDef = Messages.PromptCachingBetaTool

export const AGENT_TOOLS: ToolDef[] = [
  {
    name: 'read_file',
    description: 'Read a UTF-8 text file inside the current project.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write a UTF-8 text file inside the current project.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_dir',
    description: 'List files and folders inside the current project.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
    },
  },
  {
    name: 'search_files',
    description: 'Search file names and UTF-8 file contents inside the current project.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        path: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'exec',
    description: 'Run a command in a pseudo terminal inside the current project.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        args: { type: 'array', items: { type: 'string' } },
        cwd: { type: 'string' },
      },
      required: ['command'],
    },
  },
]
