# LangGraph Minimal - Production-Ready AI Agent

A production-ready AI agent using a simple, reliable architecture with OpenAI GPT-5-mini and custom tools, following LangGraph's recommended pattern of wrapping built-in tools.

## 🎯 **Production-Ready Features**

### **✅ Fully Working & Stable**
- ✅ **Simple Agent Architecture**: Clean, reliable implementation
- ✅ **Custom Tools**: Calculator and weather tools
- ✅ **Built-in Tool Wrappers**: Web search, code interpreter, file search (LangGraph recommended pattern)
- ✅ **GPT-5-mini Integration**: Latest OpenAI model with proper configuration
- ✅ **Basic AI Responses**: General conversation and text processing
- ✅ **TypeScript Support**: Full type safety
- ✅ **Fastify API Gateway**: Production-ready web server

### **🚀 LangGraph Recommended Pattern**
This implementation follows LangGraph's recommendation: **"Replace my_tool with wrappers around OpenAI built‑in tools"**
- Custom tool wrappers that internally call OpenAI's built-in tools
- Clean separation between custom logic and OpenAI's hosted tools
- Reliable tool orchestration with proper error handling

## 🚀 **Quick Start**

```bash
# Install dependencies
corepack enable
npm i -g pnpm@9
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys:
# - OPENAI_API_KEY (required)

# Build all packages
pnpm build

# Start development server
pnpm dev

# Test the agent
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate 2 + 2"}'
```

## 🛠️ **Available Tools**

### **✅ Custom Tools**
```bash
# Mathematical calculations
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate 2 + 2"}'

# Response: {"response": "The result of 2 + 2 is 4"}

# Real-time weather data
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Weather in San Francisco"}'

# Response: {"response": "The weather in San Francisco is 72°fahrenheit, Sunny. Humidity: 65%, Wind: 5 mph"}
```

### **✅ Built-in Tool Wrappers (LangGraph Pattern)**
```bash
# Web search using OpenAI's built-in tool
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Search for latest AI news"}'

# Code execution using OpenAI's built-in tool
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Execute this code: ```python\nprint(\"Hello World\")\n```"}'

# File search using OpenAI's built-in tool
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Search in files for API documentation"}'
```

### **✅ General Chat**
```bash
# Conversational responses
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Response: {"response": "Hello! How can I help you today?"}
```

## 📁 **Project Structure**

```
langgraph-minimal/
├── packages/
│   ├── tools/          # Framework-agnostic tools (custom + built-in wrappers)
│   ├── graphs/         # LangGraph workflows with AI enhancement
│   ├── agent/          # Simple agent with tool orchestration
│   └── core/           # Shared utilities and configurations
├── gateways/
│   └── langserve/      # Fastify server for serving agent and workflows
├── package.json        # Root workspace configuration
└── README.md          # This file
```

## 🔌 **API Endpoints**

### **Main Agent Endpoint**
```bash
POST /agent
Content-Type: application/json

{
  "message": "Your message here"
}
```

### **Available Tools**
```bash
GET /tools

# Response:
{
  "customTools": ["get_weather", "calculate"],
  "builtInTools": ["web_search", "code_interpreter", "file_search"]
}
```

## 🧪 **Usage Examples**

### **Mathematical Calculations**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate 15 * 23"}'

# Response: {"response": "The result of 15 * 23 is 345"}
```

### **Weather Information**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Weather in New York"}'

# Response: {"response": "The weather in New York is 72°fahrenheit, Sunny. Humidity: 65%, Wind: 5 mph"}
```

### **Web Search (Built-in Tool Wrapper)**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Search for OpenAI GPT-5 features"}'

# Response: {"response": "Web search results for \"OpenAI GPT-5 features\": [actual search results]"}
```

### **Code Execution (Built-in Tool Wrapper)**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Execute this code: ```python\nimport math\nprint(math.pi)\n```"}'

# Response: {"response": "Code execution results: 3.141592653589793"}
```

### **File Search (Built-in Tool Wrapper)**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Search in files for configuration settings"}'

# Response: {"response": "File search results for \"configuration settings\": [search results]"}
```

### **General AI Responses**
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain quantum computing in simple terms"}'

# Response: Detailed explanation from GPT-5-mini
```

## 🔧 **Configuration**

### **Simple Agent Configuration**
```typescript
interface SimpleAgentOptions {
  temperature?: number;              // Note: GPT-5-mini uses default (1)
  maxOutputTokens?: number;          // 1 to 4096
  topP?: number;                     // 0.0 to 1.0
}
```

### **Environment Variables**
```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional
NODE_ENV=production
PORT=3000
```

## 🚀 **Production Deployment**

### **Build & Deploy**
```bash
# Build all packages
pnpm build

# Start production server
pnpm start

# Or with Docker
docker build -t langgraph-minimal .
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key langgraph-minimal
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **"Temperature not supported" Error**
- **Cause**: GPT-5-mini only supports default temperature (1)
- **Solution**: The simple agent automatically uses the correct configuration

#### **Tool Detection Issues**
- **Cause**: Message format doesn't match expected patterns
- **Solution**: Use clear, specific language (e.g., "Calculate 2 + 2", "Weather in San Francisco")

#### **Built-in Tool Errors**
- **Cause**: OpenAI API issues or model limitations
- **Solution**: Check OpenAI API status and ensure you have access to the required features

### **Debug Mode**
```bash
# Check tool availability
curl -X GET http://localhost:3000/tools

# Test individual tools
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate 2 + 2"}'
```

## 🎯 **LangGraph Integration**

This project implements LangGraph's recommended pattern for built-in tools:

```typescript
// Example: Web Search Wrapper (LangGraph Pattern)
export const webSearchTool: Tool = {
  name: "web_search",
  execute: async (args) => {
    const { query } = args;
    
    // Call OpenAI's built-in tool internally
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [{ role: "user", content: `Search the web for: ${query}` }],
      tools: [{ type: "web_search_preview" }], // ← Built-in OpenAI tool
    });
    
    // Return formatted results
    return { success: true, results: searchResults, query };
  }
};
```

This approach provides:
- **Clean separation** between custom logic and OpenAI's hosted tools
- **Consistent interface** for all tools (custom and built-in)
- **LangGraph compatibility** for future workflow integration
- **Error handling** and result formatting
