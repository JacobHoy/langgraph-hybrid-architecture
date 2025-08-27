import { z } from 'zod';
import { Tool, toolRegistry } from './types';
import { weatherTool } from './weather';

// Weather workflow tool
const WeatherWorkflowParams = z.object({
  location: z.string().describe("The location to get weather for")
});

export const weatherWorkflowTool: Tool = {
  name: "weather_workflow",
  description: "Get weather information and personalized recommendations for a location",
  parameters: WeatherWorkflowParams,
  jsonSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The location to get weather for"
      },

    },
    required: ["location"]
  },
  execute: async (args) => {
    const { location } = WeatherWorkflowParams.parse(args);
    return await weatherTool.execute({ location });
  }
};

// Search workflow tool
const SearchWorkflowParams = z.object({
  query: z.string().describe("The search query")
});

export const searchWorkflowTool: Tool = {
  name: "search_workflow",
  description: "Perform a comprehensive search and generate a summary",
  parameters: SearchWorkflowParams,
  jsonSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query"
      }
    },
    required: ["query"]
  },
  execute: async (args) => {
    const { query } = SearchWorkflowParams.parse(args);
    // For now, return a simple search result
    return {
      query,
      results: `Search results for "${query}" would be retrieved using built-in web search`,
      totalResults: 1
    };
  }
};

// Register the workflow tools
toolRegistry.register(weatherWorkflowTool);
toolRegistry.register(searchWorkflowTool);
