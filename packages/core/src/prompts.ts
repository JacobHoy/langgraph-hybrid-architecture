// Comprehensive Prompt Management System
// This system centralizes all prompts and makes them LangSmith-compatible

// Base prompt interface for LangSmith compatibility
export interface PromptTemplate {
  id: string;
  version: string;
  template: string;
  description: string;
  tags: string[];
  variables: string[];
  metadata?: Record<string, any>;
}

// Prompt registry for managing all prompts
export class PromptRegistry {
  private prompts: Map<string, PromptTemplate> = new Map();

  register(prompt: PromptTemplate) {
    this.prompts.set(prompt.id, prompt);
  }

  get(id: string): PromptTemplate | undefined {
    return this.prompts.get(id);
  }

  getAll(): PromptTemplate[] {
    return Array.from(this.prompts.values());
  }

  getByTag(tag: string): PromptTemplate[] {
    return this.getAll().filter(prompt => prompt.tags.includes(tag));
  }
}

// Global prompt registry
export const promptRegistry = new PromptRegistry();

// Agent Prompts
export const AGENT_PROMPTS = {
  SYSTEM: {
    id: "agent_system",
    version: "1.0.0",
    template: `You are a helpful AI assistant with access to various tools and workflows. Your capabilities include:

1. **Weather Information**: Get current weather data and personalized recommendations
2. **Web Search**: Search the internet and provide summarized results
3. **Calculations**: Perform mathematical operations
4. **Workflow Orchestration**: Execute complex multi-step workflows

**Guidelines:**
- Always use the most appropriate tool for the user's request
- Provide clear, helpful responses
- When using workflows, explain what you're doing
- If a request is unclear, ask for clarification

**Available Tools:**
- Individual tools: get_weather, search_web, calculate
- Workflow tools: weather_workflow, search_workflow

Choose the right tool based on the user's needs.`,
    description: "Main system prompt for the agent",
    tags: ["agent", "system", "main"],
    variables: []
  },

  RESPONSE: {
    id: "agent_response",
    version: "1.0.0",
    template: `You are a helpful assistant with access to various tools and workflows. 
  
Based on the tool results provided, give the user a clear, helpful response that:
- Summarizes the key information
- Provides actionable insights when relevant
- Maintains a conversational tone
- Addresses the user's original question directly`,
    description: "Prompt for generating final responses with tool results",
    tags: ["agent", "response", "final"],
    variables: []
  }
};

// Workflow-specific prompts
export const WORKFLOW_PROMPTS = {
  WEATHER: {
    RECOMMENDATIONS: {
      id: "weather_recommendations",
      version: "1.0.0",
      template: `Based on the weather data for {location}:
- Temperature: {temperature}°{unit}
- Conditions: {conditions}
- Humidity: {humidity}%

Generate 3-5 personalized recommendations that are:
1. Practical and actionable
2. Specific to the weather conditions
3. Considerate of different activities (outdoor, indoor, travel)
4. Include any safety considerations

Format as a numbered list with brief explanations.`,
      description: "Generate weather-based recommendations",
      tags: ["weather", "recommendations", "workflow"],
      variables: ["location", "temperature", "unit", "conditions", "humidity"]
    },

    SYSTEM: {
      id: "weather_system",
      version: "1.0.0",
      template: `You are a weather assistant. Your job is to analyze weather data and provide personalized recommendations.

**Weather Data Analysis:**
- Temperature and conditions
- Humidity and wind information
- UV index and visibility

**Recommendation Guidelines:**
- Suggest appropriate clothing based on temperature
- Recommend activities based on weather conditions
- Provide safety tips for extreme weather
- Consider the time of day and season

**Response Format:**
- Brief weather summary
- 3-5 personalized recommendations
- Any safety warnings if applicable`,
      description: "System prompt for weather workflow",
      tags: ["weather", "system", "workflow"],
      variables: []
    }
  },

  SEARCH: {
    SUMMARY: {
      id: "search_summary",
      version: "1.0.0",
      template: `Based on the search results for "{query}":
- Total results found: {totalResults}
- Top results analyzed: {analyzedCount}

Create a comprehensive summary that:
1. Provides an overview of what was found
2. Highlights the most important information
3. Identifies patterns or trends in the results
4. Suggests any follow-up questions or areas for deeper research

Keep the summary informative but concise.`,
      description: "Generate search result summaries",
      tags: ["search", "summary", "workflow"],
      variables: ["query", "totalResults", "analyzedCount"]
    },

    SYSTEM: {
      id: "search_system",
      version: "1.0.0",
      template: `You are a search assistant. Your job is to analyze search results and provide a comprehensive summary.

**Search Analysis Guidelines:**
- Identify the most relevant results
- Extract key information and insights
- Provide context and connections between results
- Highlight any conflicting information
- Suggest follow-up questions if relevant

**Response Format:**
- Executive summary of findings
- Key insights and takeaways
- Relevant details from top results
- Any gaps or areas for further research`,
      description: "System prompt for search workflow",
      tags: ["search", "system", "workflow"],
      variables: []
    }
  }
};

// Tool-specific prompts
export const TOOL_PROMPTS = {
  CALCULATOR: {
    EXPLAIN: {
      id: "calculator_explain",
      version: "1.0.0",
      template: `You are a math tutor. Explain the calculation step by step in a clear, educational way.

**Explanation Guidelines:**
- Break down the calculation into steps
- Use simple language
- Provide context for why this calculation is useful
- Include any relevant mathematical concepts

**Format:**
1. Restate the problem
2. Show the calculation steps
3. Provide the answer
4. Explain the result in context`,
      description: "Explain mathematical calculations",
      tags: ["calculator", "explain", "education"],
      variables: []
    }
  },

  SEARCH: {
    ANALYZE: {
      id: "search_analyze",
      version: "1.0.0",
      template: `You are a research analyst. Analyze the search results and provide insights.

**Analysis Guidelines:**
- Identify the most authoritative sources
- Extract key facts and figures
- Note any conflicting information
- Provide context and relevance
- Suggest areas for deeper investigation

**Format:**
- Summary of findings
- Key insights
- Source credibility assessment
- Recommendations for further research`,
      description: "Analyze search results",
      tags: ["search", "analyze", "research"],
      variables: []
    }
  }
};

// Register all prompts
Object.values(AGENT_PROMPTS).forEach(prompt => promptRegistry.register(prompt));
Object.values(WORKFLOW_PROMPTS.WEATHER).forEach(prompt => promptRegistry.register(prompt));
Object.values(WORKFLOW_PROMPTS.SEARCH).forEach(prompt => promptRegistry.register(prompt));
Object.values(TOOL_PROMPTS.CALCULATOR).forEach(prompt => promptRegistry.register(prompt));
Object.values(TOOL_PROMPTS.SEARCH).forEach(prompt => promptRegistry.register(prompt));

// Prompt template engine with LangSmith integration
export const createPrompt = (template: string, variables: Record<string, any>): string => {
  let prompt = template;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }
  return prompt;
};

// LangSmith-compatible prompt execution
export const executePrompt = async (
  promptId: string, 
  variables: Record<string, any> = {},
  runId?: string
): Promise<string> => {
  const prompt = promptRegistry.get(promptId);
  if (!prompt) {
    throw new Error(`Prompt not found: ${promptId}`);
  }

  const filledPrompt = createPrompt(prompt.template, variables);

  // TODO: Integrate with LangSmith for prompt tracking
  if (runId && process.env.LANGSMITH_API_KEY) {
    // This would send the prompt to LangSmith for tracking
    console.log(`[LangSmith] Would track prompt ${promptId} in run ${runId}`);
  }

  return filledPrompt;
};

// Helper functions for common prompt patterns
export const promptHelpers = {
  // Create a weather recommendation prompt
  weatherRecommendation: (location: string, weatherData: any) => {
    return createPrompt(WORKFLOW_PROMPTS.WEATHER.RECOMMENDATIONS.template, {
      location,
      temperature: weatherData.temperature,
      unit: weatherData.unit,
      conditions: weatherData.condition,
      humidity: weatherData.humidity
    });
  },

  // Create a search summary prompt
  searchSummary: (query: string, searchResults: any) => {
    return createPrompt(WORKFLOW_PROMPTS.SEARCH.SUMMARY.template, {
      query,
      totalResults: searchResults.totalResults,
      analyzedCount: searchResults.results?.length || 0
    });
  },

  // Get agent system prompt
  agentSystem: () => AGENT_PROMPTS.SYSTEM.template,

  // Get agent response prompt
  agentResponse: () => AGENT_PROMPTS.RESPONSE.template
};


