import { toolRegistry } from '@langgraph-minimal/tools';
import { 
  createTracer, 
  logGraphEvent, 
  logToolExecution, 
  logError, 
  trackPerformance,
  promptHelpers
} from '@langgraph-minimal/core';
import { 
  runWeatherWorkflow, 
  runSearchWorkflow
} from '@langgraph-minimal/graphs';
import { featureFlags } from './feature-flags';
import { responsesClient } from './responses-client';

export class AgentAPI {
  constructor() {
    console.log('✅ OpenAI Responses API initialized with built-in tools and LangGraph workflows');
  }

  // Function handlers for graph-based tools
  private async handleWeatherWorkflow(args: any, runId?: string) {
    logGraphEvent("weather_workflow_called", { args }, runId);
    return await runWeatherWorkflow(args.location, args.unit, runId);
  }

  private async handleSearchWorkflow(args: any, runId?: string) {
    logGraphEvent("search_workflow_called", { args }, runId);
    return await runSearchWorkflow(args.query, runId);
  }

  // Main agent function with LangSmith tracing
  async runAgent(message: string) {
    const tracer = createTracer("agent-request", { message });
    
    try {
      logGraphEvent("agent_request_started", { message }, tracer.id);
      
      // Use Responses API exclusively
      const response = await trackPerformance(tracer.id, "llm_initial_call", async () => {
        return await responsesClient.ask({
          input: message,
          tools: [
            // Graph-based tools (LangGraph workflows wrapped as functions)
            {
              type: "function",
              name: "weather_workflow",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  unit: { type: "string", enum: ["celsius", "fahrenheit"] }
                },
                required: ["location"],
                additionalProperties: false
              }
            },
            {
              type: "function",
              name: "search_workflow",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string" }
                },
                required: ["query"],
                additionalProperties: false
              }
            }
          ]
        });
      });

      logGraphEvent("agent_llm_response", { response }, tracer.id);

      // Handle tool calls from Responses API
      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolResults: any[] = [];

        for (const toolCall of response.toolCalls) {
          const functionName = toolCall.name;
          const functionArgs = toolCall.arguments;

          logGraphEvent("tool_call_started", { functionName, functionArgs }, tracer.id);

          let result;

          // Handle individual tools
          const tool = toolRegistry.get(functionName);
          if (tool) {
            result = await trackPerformance(tracer.id, `tool_${functionName}`, async () => {
              return await tool.execute(functionArgs);
            });
            logToolExecution(tracer.id, functionName, functionArgs, result);
          }
          // Handle LangGraph workflow tools with proper state management
          else if (functionName === "weather_workflow") {
            result = await trackPerformance(tracer.id, "workflow_weather", async () => {
              return await this.handleWeatherWorkflow(functionArgs, tracer.id);
            });
          }
          else if (functionName === "search_workflow") {
            result = await trackPerformance(tracer.id, "workflow_search", async () => {
              return await this.handleSearchWorkflow(functionArgs, tracer.id);
            });
          }
          // Handle built-in tools
          else if (functionName === "web_search") {
            result = { message: "Web search performed", query: functionArgs.query };
          }
          else if (functionName === "code_interpreter") {
            result = { message: "Code interpreter executed", code: functionArgs.code };
          }
          else if (functionName === "file_search") {
            result = { message: "File search performed", query: functionArgs.query };
          }
          // Handle unknown tools
          else {
            logGraphEvent("unknown_tool_called", { functionName }, tracer.id);
            result = { error: `Unknown tool: ${functionName}` };
          }

          logGraphEvent("tool_call_completed", { functionName, result }, tracer.id);
          toolResults.push(result);
        }

        // For Responses API, we return the results directly
        logGraphEvent("agent_request_completed", { 
          response: JSON.stringify(toolResults) 
        }, tracer.id);

        return JSON.stringify(toolResults, null, 2);
      }

      // Return direct response content
      logGraphEvent("agent_request_completed", { 
        response: response.content 
      }, tracer.id);

      return response.content;
    } catch (error) {
      logError(tracer.id, error as Error, { message });
      throw error;
    } finally {
      tracer.end();
    }
  }

  // Get available tools
  getAvailableTools() {
    const flags = featureFlags.getFlags();
    return {
      customTools: toolRegistry.getOpenAITools(),
      featureFlags: flags,
      note: "Using OpenAI Responses API with built-in tools and LangGraph workflows"
    };
  }

  // Feature flag management methods
  enableBuiltInTools() {
    featureFlags.enableBuiltInTools();
    console.log('✅ Built-in tools enabled');
  }

  disableBuiltInTools() {
    featureFlags.disableBuiltInTools();
    console.log('✅ Built-in tools disabled');
  }

  toggleBuiltInTools() {
    featureFlags.toggleBuiltInTools();
    console.log('🔄 Built-in tools toggled');
  }
}

// Export singleton instance
export const agentAPI = new AgentAPI();
