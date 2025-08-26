import { z } from 'zod';
import { Tool, toolRegistry } from './types';

const SearchParams = z.object({
  query: z.string().describe("The search query to look up"),
  maxResults: z.number().optional().default(5).describe("Maximum number of results to return")
});

export const searchTool: Tool = {
  name: "search_web",
  description: "Search the web for current information on a topic",
  parameters: SearchParams,
  jsonSchema: {
    type: "object",
    properties: {
      query: { 
        type: "string",
        description: "The search query to look up"
      },
      maxResults: { 
        type: "number",
        description: "Maximum number of results to return",
        default: 5
      }
    },
    required: ["query"]
  },
  execute: async (args) => {
    const { query, maxResults } = SearchParams.parse(args);
    
    // Mock search API call - replace with real implementation
    const mockResults = Array.from({ length: maxResults }, (_, i) => ({
      title: `Result ${i + 1} for "${query}"`,
      url: `https://example.com/result-${i + 1}`,
      snippet: `This is a mock search result for "${query}". In a real implementation, this would contain actual search results.`
    }));
    
    return {
      query,
      results: mockResults,
      totalResults: maxResults
    };
  }
};

toolRegistry.register(searchTool);
