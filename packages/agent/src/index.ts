import OpenAI from 'openai';
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

export class AgentAPI {
  private openai: OpenAI;
  private tools: any[];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Initialize tools array with custom tools
    this.tools = [
      // Custom tools from registry
      ...toolRegistry.getOpenAITools(),
      
      // Graph-based tools (LangGraph workflows wrapped as functions)
      {
        type: "function" as const,
        function: {
          name: "weather_workflow",
          description: "Get weather information and recommendations using LangGraph orchestration",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string" },
              unit: { type: "string", enum: ["celsius", "fahrenheit"] }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "search_workflow",
          description: "Search the web and get summarized results using LangGraph orchestration",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" }
            },
            required: ["query"]
          }
        }
      }
    ];
    
    console.log('✅ OpenAI Chat Completions API initialized with custom tools and workflows');
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
      
      // Use Responses API with unified tools array
      const response = await trackPerformance(tracer.id, "llm_initial_call", async () => {
        return await this.openai.chat.completions.create({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content: promptHelpers.agentSystem()
            },
            {
              role: "user",
              content: message
            }
          ],
          tools: this.tools,
          tool_choice: "auto"
        });
      });

      const responseMessage = response.choices[0].message;
      logGraphEvent("agent_llm_response", { responseMessage }, tracer.id);

      // Handle tool calls
      if (responseMessage.tool_calls) {
        const toolResults: any[] = [];

        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

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
          // Handle LangGraph workflow tools
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
          // Handle unknown tools
          else {
            logGraphEvent("unknown_tool_called", { functionName }, tracer.id);
            result = { error: `Unknown tool: ${functionName}` };
          }

          logGraphEvent("tool_call_completed", { functionName, result }, tracer.id);

          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: JSON.stringify(result)
          });
        }

        // Get final response with tool results
        const finalResponse = await trackPerformance(tracer.id, "llm_final_response", async () => {
          return await this.openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [
              {
                role: "system",
                content: promptHelpers.agentResponse()
              },
              {
                role: "user",
                content: message
              },
              responseMessage,
              ...toolResults
            ]
          });
        });

        logGraphEvent("agent_request_completed", { 
          finalResponse: finalResponse.choices[0].message.content 
        }, tracer.id);

        return finalResponse.choices[0].message.content;
      }

      logGraphEvent("agent_request_completed", { 
        response: responseMessage.content 
      }, tracer.id);

      return responseMessage.content;
    } catch (error) {
      logError(tracer.id, error as Error, { message });
      throw error;
    } finally {
      tracer.end();
    }
  }

  // Get available tools
  getAvailableTools() {
    return {
      customTools: this.tools.filter(tool => tool.type === "function"),
      note: "Using OpenAI Chat Completions API with custom tools and LangGraph workflows"
    };
  }
}

// Export singleton instance
export const agentAPI = new AgentAPI();
