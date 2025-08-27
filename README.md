# LangGraph Minimal - Responses API + LangGraph Architecture

A production-ready, minimal setup combining OpenAI's Responses API with LangGraph workflows for maximum flexibility and power.

## 🚀 **Architecture Overview**

This project implements a **modern hybrid architecture** that leverages the best of both worlds:

1. **Tools** (`packages/tools`) - Framework-agnostic plain TypeScript functions
2. **Graphs** (`packages/graphs`) - LangGraph workflows that orchestrate tools with AI enhancement
3. **Agent API** (`packages/agent`) - OpenAI Responses API with built-in tools + custom workflows
4. **Gateway** (`gateways/langserve`) - Fastify server exposing both Agent API and direct workflow access

## ✨ **Key Features**

- **🔄 OpenAI Responses API**: Latest unified API with built-in tools (web search, code interpreter)
- **🧠 LangGraph Integration**: Full state management and workflow orchestration
- **🛠️ Built-in Tools**: Real-time web search, code execution with container management
- **🎯 Custom Tools**: Framework-agnostic TypeScript functions
- **📊 Observability**: Built-in tracing, logging, and performance monitoring
- **⚡ TypeScript**: Full type safety across the entire project
- **🎛️ Feature Flags**: Runtime control over built-in tools
- **🚀 Production Ready**: Error handling, container lifecycle management

## 🛠️ **Available Tools**

### **Built-in OpenAI Tools (Responses API)**
- **`web_search_preview`** - Real-time web search with current information
- **`code_interpreter`** - Code execution with automatic container management

### **Custom Tools**
- **`get_weather`** - Weather information for any location
- **`calculate`** - Mathematical calculations with precision control

### **LangGraph Workflows**
- **`weather_workflow`** - Weather data + AI-powered recommendations
- **`search_workflow`** - Web search + AI summarization

## 🚀 **Quickstart**

```bash
# Install dependencies
corepack enable
npm i -g pnpm@9
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys:
# - OPENAI_API_KEY (required)

# Start development
pnpm dev

# Test the API
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 15 * 23?"}'
```

## 📁 **Project Structure**

```
langgraph-minimal/
├── packages/
│   ├── tools/          # Framework-agnostic tools (plain TS functions)
│   ├── graphs/         # LangGraph workflows with AI enhancement
│   ├── agent/          # Responses API layer with built-in tools
│   └── core/           # Shared utilities and configurations
├── gateways/
│   └── langserve/      # Fastify server for serving agent and workflows
├── package.json        # Root workspace configuration
└── README.md          # This file
```

## 🔌 **API Endpoints**

### **Agent API**
```bash
# Main agent endpoint
POST /agent
Content-Type: application/json

{
  "message": "What's the weather like in San Francisco?"
}
```

### **Feature Flag Management**
```bash
# Enable built-in tools
POST /api/enable-builtin-tools

# Disable built-in tools
POST /api/disable-builtin-tools

# Toggle built-in tools
POST /api/toggle-builtin-tools

# Check current flags
GET /api/flags
```

### **Health Check**
```bash
GET /ping
```

## 🧪 **Usage Examples**

### **Basic Calculations**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 15 * 23?"}'
```

### **Real-time Web Search**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the current weather in San Francisco?"}'
```

### **LangGraph Workflow**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Get weather information for Tokyo using the weather_workflow"}'
```

### **Code Execution**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate the factorial of 10"}'
```

## 🔧 **How It Works**

### **1. Tools Layer**
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

### **2. Graphs Layer**
Workflows orchestrate tools with AI enhancement:

```typescript
// packages/graphs/src/weather-workflow.ts
export const runWeatherWorkflow = async (location: string) => {
  const weatherData = await weatherTool.execute({ location });
  const recommendations = await generateAIRecommendations(weatherData);
  return { weatherData, recommendations };
};
```

### **3. Agent Layer (Responses API)**
The Agent API uses OpenAI's Responses API with built-in tools:

```typescript
// packages/agent/src/index.ts
const response = await responsesClient.ask({
  input: message,
  tools: [
    { type: "web_search_preview" },
    { type: "code_interpreter", container: containerId },
    // Custom tools and workflows
  ]
});
```

### **4. Gateway Layer**
Exposes both Agent API and direct workflow access:

```typescript
// Agent API (Responses API)
fastify.post("/agent", async (request, reply) => {
  const response = await agentAPI.runAgent(message);
  return { response };
});
```

## 🏗️ **Technical Architecture**

### **Responses API Integration**
- **Built-in Tools**: `web_search_preview`, `code_interpreter`
- **Container Management**: Automatic creation and reuse
- **Schema Compatibility**: Proper JSON schema validation
- **Error Handling**: Robust error recovery

### **LangGraph State Management**
- **Tracing**: Full request tracing with unique IDs
- **Performance**: Timing and performance monitoring
- **Logging**: Comprehensive event logging
- **Error Recovery**: Graceful error handling

### **Feature Flag System**
- **Runtime Control**: Enable/disable built-in tools
- **A/B Testing**: Toggle capabilities for testing
- **Configuration**: JSON-based flag management

## 📊 **Performance & Benefits**

### **Responses API Advantages**
- ✅ **Built-in Tools**: Real-time web search, code interpreter
- ✅ **Stateful**: Maintains conversation context
- ✅ **Unified**: Single API for all tool types
- ✅ **Simpler**: No complex tool call handling

### **LangGraph Benefits**
- ✅ **Observability**: Full tracing and monitoring
- ✅ **State Management**: Proper workflow state tracking
- ✅ **Performance**: Optimized execution with timing
- ✅ **Error Handling**: Robust error recovery

## 🔄 **Migration from Chat Completions**

This project has fully migrated from OpenAI's Chat Completions API to the Responses API:

### **What Changed**
- ✅ **Removed**: Chat Completions API entirely
- ✅ **Added**: Responses API with built-in tools
- ✅ **Enhanced**: Container management for code interpreter
- ✅ **Simplified**: Single API architecture

### **Benefits Achieved**
- 🚀 **Better Performance**: Built-in tools are faster
- 🔧 **Simpler Code**: No dual API complexity
- 🎯 **More Capabilities**: Real-time search, code execution
- 📊 **Better Observability**: Unified tracing

## 🚀 **Production Deployment**

### **Environment Variables**
```bash
OPENAI_API_KEY=your_openai_api_key
```

### **Build & Deploy**
```bash
# Build all packages
pnpm build

# Start production server
pnpm start
```

### **Docker Support**
```bash
# Build Docker image
docker build -t langgraph-minimal .

# Run container
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key langgraph-minimal
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

## 🆘 **Support**

- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check the code comments and examples

---

**Built with ❤️ using OpenAI Responses API + LangGraph**
