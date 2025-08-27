import { z } from 'zod';
import { Tool, toolRegistry } from './types';

const WeatherParams = z.object({
  location: z.string().describe("The city and state, e.g. San Francisco, CA")
});

export const weatherTool: Tool = {
  name: "get_weather",
  description: "Get the current weather information for a specific location",
  parameters: WeatherParams,
  jsonSchema: {
    type: "object",
    properties: {
      location: { 
        type: "string",
        description: "The city and state, e.g. San Francisco, CA"
      }
    },
    required: ["location"]
  },
  execute: async (args) => {
    const { location } = WeatherParams.parse(args);
    
    // Mock weather API call - replace with real implementation
    const mockWeather = {
      location,
      temperature: 72,
      unit: "fahrenheit",
      condition: "Sunny",
      humidity: "65%",
      windSpeed: "5 mph"
    };
    
    return mockWeather;
  }
};

// Register the tool
toolRegistry.register(weatherTool);
