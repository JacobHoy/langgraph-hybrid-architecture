# Hybrid LangGraph + OpenAI Agent API Architecture

A minimal, production-ready setup combining LangGraph workflows with OpenAI Agent API for maximum flexibility and power.

## Architecture Overview

This project implements a **hybrid architecture** that gives you the best of both worlds:

1. **Tools** (`packages/tools`) - Framework-agnostic plain TypeScript functions
2. **Graphs** (`packages/graphs`) - LangGraph workflows that stitch tools together
3. **Agent API** (`packages/agent`) - Hybrid layer using OpenAI Agent API with hosted tools + Chat Completions for custom tools
4. **Gateway** (`gateways/langserve`) - Fastify server exposing both Agent API and direct workflow access

## Features

- **Framework-agnostic tools**: Plain TypeScript functions that can be used anywhere
- **LangGraph workflows**: Complex workflows that stitch tools together
- **OpenAI Agent API**: Hybrid approach using hosted tools (web search, code interpreter) + custom tools
- **Flexibility**: Use tools individually, in workflows, or through the agent
- **TypeScript**: Full type safety across the entire project
- **Observability**: Built-in logging and event tracking
- **LangSmith Integration**: Advanced tracing, debugging, and monitoring (optional)
- **Hosted Tools**: Built-in web search and code interpreter via OpenAI Agent API

## Quickstart

```bash
# Install dependencies
corepack enable
npm i -g pnpm@9
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys:
# - OPENAI_API_KEY (required)
# - LANGSMITH_API_KEY (optional, for observability)

# Start development
pnpm dev

# Test the API
node test-api.js
```

## Project Structure

```
langgraph-minimal/
├── packages/
│   ├── tools/          # Framework-agnostic tools (plain TS functions)
│   ├── graphs/         # LangGraph workflows that stitch tools together
│   ├── agent/          # Hybrid Agent API layer (OpenAI Agent API + Chat Completions)
│   └── core/           # Shared utilities and configurations
├── gateways/
│   └── langserve/      # Fastify server for serving graphs and agent
├── package.json        # Root workspace configuration
├── test-api.js         # API testing script
└── README.md          # This file
```

## API Endpoints

### Health Check
```bash
GET /ping
```

### Agent API
```bash
POST /agent
Content-Type: application/json

{
  "message": "What's the weather like in San Francisco?"
}
```

### Available Tools
```bash
GET /tools
```

### Direct Workflow Access
```bash
POST /workflows/weather
Content-Type: application/json

{
  "location": "New York, NY",
  "unit": "fahrenheit"
}
```

```bash
POST /workflows/search
Content-Type: application/json

{
  "query": "latest AI developments"
}
```

## Available Tools

### OpenAI Hosted Tools (via Agent API)
- **Web Search** - Search the web for current information
- **Code Interpreter** - Execute code and perform calculations

### Custom Tools (via Chat Completions)
- **get_weather** - Get weather information for a location
- **search_web** - Search the web for current information
- **calculate** - Perform mathematical calculations

### Workflow Tools
- **weather_workflow** - Get weather + recommendations
- **search_workflow** - Search + summarize results

## How It Works

### 1. Tools Layer
Tools are plain TypeScript functions with Zod validation:

```typescript
// packages/tools/src/weather.ts
export const weatherTool: Tool = {
  name: "get_weather",
  description: "Get weather information",
  parameters: WeatherParams,
  execute: async (args) => {
    // Implementation here
  }
};
```

### 2. Graphs Layer
Workflows stitch tools together:

```typescript
// packages/graphs/src/weather-workflow.ts
export const runWeatherWorkflow = async (location: string) => {
  const weatherData = await weatherTool.execute({ location });
  const recommendations = generateRecommendations(weatherData);
  return { weatherData, recommendations };
};
```

### 3. Agent Layer (Hybrid)
The Agent API uses a hybrid approach:

```typescript
// packages/agent/src/index.ts
// OpenAI Agent API with hosted tools
this.agent = new Agent({
  name: "HybridAgent",
  model: "gpt-5-mini",
  tools: [webSearchTool(), codeInterpreterTool()],
  instructions: "You can search the web and run code..."
});

// Fallback to Chat Completions for custom tools
this.tools = toolRegistry.getOpenAITools();
this.tools.push({
  type: "function",
  function: {
    name: "weather_workflow",
    description: "Get weather + recommendations",
    parameters: { /* ... */ }
  }
});
```

### 4. Gateway Layer
Exposes both Agent API and direct workflow access:

```typescript
// Agent API (hybrid)
fastify.post("/agent", async (request, reply) => {
  const response = await agentAPI.runAgent(message);
  return { response };
});

// Direct workflow access
fastify.post("/workflows/weather", async (request, reply) => {
  const result = await runWeatherWorkflow(location);
  return { result };
});
```

## Agent API Interface Challenges & Solutions

### Challenges Identified
1. **Wrong Tool Integration**: Initially tried to add `{ type: "web_search" }` directly to tools array
2. **Missing Proper Imports**: Not importing the hosted tool functions
3. **Incorrect Execution Method**: Trying to use `agent.invoke()` instead of `run(agent, message)`
4. **Tool Type Mismatches**: Agent API expects different tool types than Chat Completions

### Solutions Implemented
1. **Proper Hosted Tools**: Using `webSearchTool()`, `codeInterpreterTool()` functions
2. **Correct Imports**: `import { Agent, run, webSearchTool, codeInterpreterTool } from '@openai/agents'`
3. **Hybrid Architecture**: Agent API for hosted tools, Chat Completions for custom tools
4. **Fallback Strategy**: Seamless fallback when Agent API can't handle custom tools

### Current Implementation
- **Agent API**: Handles web search, code interpretation, and general queries
- **Chat Completions**: Handles custom tools and LangGraph workflows
- **Automatic Fallback**: Seamless switching between APIs based on query type
- **Unified Interface**: Single `/agent` endpoint that intelligently routes requests

## Benefits

1. **Separation of Concerns**: Each layer has a clear responsibility
2. **Framework-agnostic**: Tools can be used with any framework
3. **Flexibility**: Use tools individually, in workflows, or through the agent
4. **Scalability**: Easy to add new tools and workflows
5. **Beginner-friendly**: Clear architecture that's easy to understand
6. **Production-ready**: Built-in observability and error handling
7. **Best of Both Worlds**: OpenAI's hosted tools + custom LangGraph workflows

## Prompt Management System

This project includes a comprehensive prompt management system that centralizes all prompts and makes them LangSmith-compatible.

### Features

- **Centralized Prompts**: All prompts are managed in `packages/core/src/prompts.ts`
- **Version Control**: Each prompt has version tracking for A/B testing
- **LangSmith Integration**: Prompts are tracked and can be versioned in LangSmith
- **Template Engine**: Variable substitution for dynamic prompts
- **Prompt Registry**: Easy discovery and management of all prompts

### Prompt Categories

#### Agent Prompts
- **System Prompt**: Main agent personality and capabilities
- **Response Prompt**: Final response generation with tool results

#### Workflow Prompts
- **Weather Recommendations**: Generate personalized weather advice
- **Search Summaries**: Create comprehensive search result summaries

#### Tool Prompts
- **Calculator Explanations**: Educational math explanations
- **Search Analysis**: Research result analysis

### Example Usage

```typescript
import { promptHelpers, executePrompt } from '@langgraph-minimal/core';

// Use helper functions
const systemPrompt = promptHelpers.agentSystem();

// Execute prompts with variables
const weatherPrompt = await executePrompt('weather_recommendations', {
  location: 'San Francisco',
  temperature: 72,
  unit: 'fahrenheit'
}, runId);
```

### Benefits

- **A/B Testing**: Test different prompt versions in LangSmith
- **Performance Tracking**: Compare prompt effectiveness
- **Easy Updates**: Change prompts without code deployments
- **Consistency**: Centralized prompt management across workflows

## LangSmith Observability (Optional)

This project includes optional LangSmith integration for advanced observability, debugging, and monitoring.

### Setup LangSmith

1. **Get API Key**: Sign up at [LangSmith](https://smith.langchain.com) and get your API key
2. **Add to Environment**: Add to your `.env` file:
   ```bash
   LANGSMITH_API_KEY=your_langsmith_api_key_here
   LANGSMITH_PROJECT=langgraph-hybrid-architecture
   ```

### What You'll See in LangSmith

- **Traces**: Every agent request with detailed step-by-step execution
- **Tool Performance**: Individual tool execution times and success rates
- **Workflow Analysis**: Visual representation of workflow execution
- **Error Tracking**: Detailed error context and debugging information
- **Cost Monitoring**: Token usage and API cost tracking
- **Performance Metrics**: Latency, throughput, and optimization insights
- **Prompt Tracking**: Version control and A/B testing for prompts

### Benefits

- **Debugging**: Step-by-step debugging with visual interface
- **Optimization**: Identify bottlenecks and performance issues
- **Monitoring**: Real-time health monitoring and alerting
- **Analytics**: Usage patterns and user behavior insights
- **Prompt Management**: Version, test, and optimize prompts

## Development

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run tests across all packages
- `node test-api.js` - Test API endpoints

## Next Steps

### Add More Tools
Create new tools in `packages/tools/src/`:

```typescript
export const newTool: Tool = {
  name: "new_tool",
  description: "Description of what the tool does",
  parameters: z.object({
    // Define parameters
  }),
  execute: async (args) => {
    // Implementation
  }
};
```

### Add More Workflows
Create new workflows in `packages/graphs/src/`:

```typescript
export const runNewWorkflow = async (input: string) => {
  // Stitch tools together
  const result1 = await tool1.execute(args1);
  const result2 = await tool2.execute(args2);
  return { result1, result2 };
};
```

### Add to Agent API
Register new tools/workflows in `packages/agent/src/index.ts`:

```typescript
this.tools.push({
  type: "function",
  function: {
    name: "new_workflow",
    description: "Description",
    parameters: { /* ... */ }
  }
});
```

### Enable LangSmith
Set up observability for production monitoring and debugging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT
