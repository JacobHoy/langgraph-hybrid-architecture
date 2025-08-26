import OpenAI from 'openai';
import { toolRegistry } from '@langgraph-minimal/tools';
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
    
    // Get all available tools
    this.tools = toolRegistry.getOpenAITools();
    
    // Add graph-based tools
    this.tools.push(
      {
        type: "function" as const,
        function: {
          name: "weather_workflow",
          description: "Get weather information and recommendations",
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
          description: "Search the web and get summarized results",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" }
            },
            required: ["query"]
          }
        }
      }
    );
  }

  // Function handlers for graph-based tools
  private async handleWeatherWorkflow(args: any) {
    return await runWeatherWorkflow(args.location, args.unit);
  }

  private async handleSearchWorkflow(args: any) {
    return await runSearchWorkflow(args.query);
  }

  // Main agent function
  async runAgent(message: string) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant with access to various tools and workflows. Use the appropriate tool based on the user's request."
        },
        {
          role: "user",
          content: message
        }
      ],
      tools: this.tools,
      tool_choice: "auto"
    });

    const responseMessage = response.choices[0].message;

    // Handle tool calls
    if (responseMessage.tool_calls) {
      const toolResults = [];

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let result;

        // Handle individual tools
        const tool = toolRegistry.get(functionName);
        if (tool) {
          result = await tool.execute(functionArgs);
        }
        // Handle graph-based tools
        else if (functionName === "weather_workflow") {
          result = await this.handleWeatherWorkflow(functionArgs);
        }
        else if (functionName === "search_workflow") {
          result = await this.handleSearchWorkflow(functionArgs);
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool" as const,
          content: JSON.stringify(result)
        });
      }

      // Get final response with tool results
      const finalResponse = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant with access to various tools and workflows."
          },
          {
            role: "user",
            content: message
          },
          responseMessage,
          ...toolResults
        ]
      });

      return finalResponse.choices[0].message.content;
    }

    return responseMessage.content;
  }

  // Get available tools
  getAvailableTools() {
    return this.tools;
  }
}

// Export singleton instance
export const agentAPI = new AgentAPI();
