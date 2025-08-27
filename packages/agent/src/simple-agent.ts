import { ChatOpenAI } from "@langchain/openai";
import { toolRegistry } from "@langgraph-minimal/tools";
import { logGraphEvent } from "@langgraph-minimal/core";

export interface SimpleAgentOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topLogprobs?: number;
  parallelToolCalls?: boolean;
  structuredOutput?: {
    name: string;
    schema: any;
  };
}

export interface SimpleAgentResponse {
  response: string;
  error?: string;
  toolCalls?: any[];
  toolResults?: any[];
}

export class SimpleAgent {
  private model: ChatOpenAI;
  private config: {
    temperature: number;
    maxOutputTokens?: number;
    topP?: number;
    topLogprobs?: number;
    parallelToolCalls?: boolean;
  };

  constructor(config: Partial<SimpleAgentOptions> = {}) {
    this.config = {
      temperature: 1, // GPT-5-mini only supports default temperature
      maxOutputTokens: config.maxOutputTokens,
      topP: config.topP,
      topLogprobs: config.topLogprobs,
      parallelToolCalls: config.parallelToolCalls,
    };

    this.model = new ChatOpenAI({
      modelName: "gpt-5-mini",
      // GPT-5-mini only supports default temperature (1)
      maxTokens: this.config.maxOutputTokens,
      topP: this.config.topP,
    });
  }

  /**
   * Run the simple agent with a message
   */
  async runAgent(message: string, options?: SimpleAgentOptions): Promise<SimpleAgentResponse> {
    try {
      logGraphEvent("simple_agent_started", { message, options });

      // Get available tools
      const availableTools = toolRegistry.getAll();
      
      // Check if we need to use tools
      const needsFileSearch = message.toLowerCase().includes('file') &&
                             (message.toLowerCase().includes('search') ||
                              message.toLowerCase().includes('find') ||
                              message.toLowerCase().includes('look for')) &&
                             !message.toLowerCase().includes('web search') &&
                             !message.toLowerCase().includes('internet search');
      
      const needsWebSearch = (message.toLowerCase().includes('search') ||
                            message.toLowerCase().includes('find') ||
                            message.toLowerCase().includes('look up') ||
                            message.toLowerCase().includes('web search') ||
                            message.toLowerCase().includes('internet search')) &&
                           !needsFileSearch;
      
      const needsCodeInterpreter = message.includes('```') ||
                                  message.toLowerCase().includes('code') ||
                                  message.toLowerCase().includes('execute') ||
                                  message.toLowerCase().includes('run code') ||
                                  message.toLowerCase().includes('python') ||
                                  message.toLowerCase().includes('javascript');
      
      const needsCalculation = message.toLowerCase().includes('calculate') || 
                              message.toLowerCase().includes('math') ||
                              /\d+\s*[\+\-\*\/]\s*\d+/.test(message) ||
                              /calculate\s+\d/.test(message.toLowerCase());
      
      const needsWeather = message.toLowerCase().includes('weather') ||
                          message.toLowerCase().includes('temperature');

      let response = "";
      let toolCalls: any[] = [];
      let toolResults: any[] = [];

      if (needsFileSearch) {
        // Extract file search query from message
        const fileSearchMatch = message.match(/(?:search|find|look for)\s+(?:in\s+)?(?:files?|documents?)\s+(?:for\s+)?(.+)/i);
        if (fileSearchMatch) {
          const query = fileSearchMatch[1].trim();
          const fileSearchTool = availableTools.find(t => t.name === 'file_search');
          if (fileSearchTool) {
            try {
              const result = await fileSearchTool.execute({ query });
              if (result.success) {
                response = `File search results for "${query}": ${result.results}`;
              } else {
                response = `File search failed: ${result.error}`;
              }
              toolCalls.push({ name: 'file_search', parameters: { query } });
              toolResults.push({ name: 'file_search', result });
            } catch (error: any) {
              response = `I couldn't search files: ${error.message}`;
            }
          }
        } else {
          response = "I couldn't understand what you want me to search for in files. Please provide a search query.";
        }
      } else if (needsWebSearch) {
        // Extract search query from message
        const searchMatch = message.match(/(?:search|find|look up|web search|internet search)\s+(?:for\s+)?(.+)/i);
        if (searchMatch) {
          const query = searchMatch[1].trim();
          const webSearchTool = availableTools.find(t => t.name === 'web_search');
          if (webSearchTool) {
            try {
              const result = await webSearchTool.execute({ query });
              if (result.success) {
                response = `Web search results for "${query}": ${result.results}`;
              } else {
                response = `Web search failed: ${result.error}`;
              }
              toolCalls.push({ name: 'web_search', parameters: { query } });
              toolResults.push({ name: 'web_search', result });
            } catch (error: any) {
              response = `I couldn't search the web: ${error.message}`;
            }
          }
        } else {
          response = "I couldn't understand what you want me to search for. Please provide a search query.";
        }
      } else if (needsCodeInterpreter) {
        // Extract code from message
        const codeMatch = message.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
        if (codeMatch) {
          const code = codeMatch[1].trim();
          const codeInterpreterTool = availableTools.find(t => t.name === 'code_interpreter');
          if (codeInterpreterTool) {
            try {
              const result = await codeInterpreterTool.execute({ code });
              if (result.success) {
                response = `Code execution results: ${result.results}`;
              } else {
                response = `Code execution failed: ${result.error}`;
              }
              toolCalls.push({ name: 'code_interpreter', parameters: { code } });
              toolResults.push({ name: 'code_interpreter', result });
            } catch (error: any) {
              response = `I couldn't execute the code: ${error.message}`;
            }
          }
        } else {
          response = "I found code-related keywords but couldn't extract the code. Please provide the code in a code block (```).";
        }
      } else if (needsCalculation) {
        // Extract calculation from message
        let expression = "";
        const calcMatch = message.match(/(\d+\s*[\+\-\*\/]\s*\d+)/);
        if (calcMatch) {
          expression = calcMatch[1];
        } else if (message.toLowerCase().includes('calculate')) {
          // Extract numbers after "calculate"
          const numMatch = message.match(/calculate\s+(\d+\s*[\+\-\*\/]\s*\d+)/i);
          if (numMatch) {
            expression = numMatch[1];
          }
        }
        
        if (expression) {
          const calculator = availableTools.find(t => t.name === 'calculate');
          if (calculator) {
            try {
              const result = await calculator.execute({ expression });
              response = `The result of ${expression} is ${result.result}`;
              toolCalls.push({ name: 'calculate', parameters: { expression } });
              toolResults.push({ name: 'calculate', result });
            } catch (error: any) {
              response = `I couldn't calculate that: ${error.message}`;
            }
          }
        } else {
          response = "I couldn't find a valid calculation expression in your message.";
        }
      } else if (needsWeather) {
        // Extract location from message
        const locationMatch = message.match(/weather\s+(?:in\s+)?([^.]+)/i);
        if (locationMatch) {
          const location = locationMatch[1].trim();
          const weatherTool = availableTools.find(t => t.name === 'get_weather');
          if (weatherTool) {
            try {
              const result = await weatherTool.execute({ location });
              response = `The weather in ${location} is ${result.temperature}°${result.unit}, ${result.condition}. Humidity: ${result.humidity}, Wind: ${result.windSpeed}`;
              toolCalls.push({ name: 'get_weather', parameters: { location } });
              toolResults.push({ name: 'get_weather', result });
            } catch (error: any) {
              response = `I couldn't get the weather for ${location}: ${error.message}`;
            }
          }
        }
      } else {
        // General response
        const result = await this.model.invoke([
          { role: "user", content: message }
        ]);
        response = result.content as string;
      }

      logGraphEvent("simple_agent_completed", { 
        message,
        hasResponse: !!response,
        toolCount: toolCalls.length
      });

      return {
        response,
        toolCalls,
        toolResults,
      };
    } catch (error: any) {
      logGraphEvent("simple_agent_error", { message, error: error.message });
      
      return {
        response: `I apologize, but I encountered an error: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools(): { customTools: string[]; builtInTools: string[] } {
    const allTools = toolRegistry.getAll();
    const customTools = allTools.filter(tool => 
      ['calculate', 'get_weather'].includes(tool.name)
    ).map(tool => tool.name);
    const builtInTools = allTools.filter(tool => 
      ['web_search', 'code_interpreter', 'file_search'].includes(tool.name)
    ).map(tool => tool.name);
    
    return {
      customTools,
      builtInTools
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SimpleAgentOptions>) {
    this.config = { ...this.config, ...newConfig };
    this.model = new ChatOpenAI({
      modelName: "gpt-5-mini",
      temperature: this.config.temperature,
      maxTokens: this.config.maxOutputTokens,
      topP: this.config.topP,
    });
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }
}
