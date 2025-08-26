import { z } from 'zod';

// Base tool interface with JSON Schema support
export interface Tool {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  jsonSchema: any; // Add this for OpenAI compatibility
  execute: (args: any) => Promise<any>;
}

// Tool registry
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getOpenAITools() {
    return this.getAll().map(tool => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.jsonSchema // Use this instead of tool.parameters.shape
      }
    }));
  }
}

// Global tool registry
export const toolRegistry = new ToolRegistry();
