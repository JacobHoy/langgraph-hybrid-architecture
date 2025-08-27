import OpenAI from 'openai';
import { toolRegistry } from '@langgraph-minimal/tools';

export interface ResponsesClientConfig {
  model?: string;
  enableBuiltInTools?: boolean;
}

export interface ResponsesRequest {
  input: string;
  tools?: any[];
  responseFormat?: {
    type: 'json_schema';
    schema: any;
  };
}

export interface ResponsesResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    type: 'web_search_call' | 'function_call' | 'code_interpreter_call' | 'file_search_call';
  }>;
  metadata?: any;
}

export class ResponsesClient {
  private openai: OpenAI;
  private config: ResponsesClientConfig;
  private containerId: string | null = null;

  constructor(config: ResponsesClientConfig = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.config = {
      model: "gpt-4o-mini",
      enableBuiltInTools: true,
      ...config
    };
  }

  /**
   * Get or create a container for code_interpreter
   */
  private async getContainer(): Promise<string> {
    if (!this.containerId) {
      const container = await this.openai.containers.create({
        name: "langgraph-minimal-container"
      });
      this.containerId = container.id;
      console.log('✅ Container created for code_interpreter:', this.containerId);
    }
    return this.containerId;
  }

    /**
   * Main method to ask the Responses API
   */
  async ask(request: ResponsesRequest): Promise<ResponsesResponse> {
    const tools = await this.buildTools(request.tools);

    const response = await this.openai.responses.create({
      model: this.config.model!,
      input: request.input,
      tools,
      ...(request.responseFormat && { response_format: request.responseFormat })
    });

    return this.parseResponse(response);
  }

  /**
   * Build tools array with proper schema for Responses API
   */
  private async buildTools(customTools?: any[]): Promise<any[]> {
    const tools: any[] = [];

    // Add built-in tools if enabled
    if (this.config.enableBuiltInTools) {
      tools.push(
        { type: "web_search_preview" as const }
      );
      
      // Add code_interpreter with container
      const containerId = await this.getContainer();
      tools.push({ type: "code_interpreter" as const, container: containerId });
    }

    // Add custom tools from registry
    const registryTools = toolRegistry.getOpenAITools().map(tool => ({
      type: "function" as const,
      name: tool.function.name,
      parameters: this.fixSchemaForResponses(tool.function.parameters),
      strict: true
    }));

    tools.push(...registryTools);

    // Add custom tools passed in request
    if (customTools) {
      const fixedCustomTools = customTools.map(tool => ({
        ...tool,
        parameters: this.fixSchemaForResponses(tool.parameters),
        strict: true
      }));
      tools.push(...fixedCustomTools);
    }

    return tools;
  }

  /**
   * Fix schema for Responses API compatibility
   */
  private fixSchemaForResponses(schema: any): any {
    const fixed = { ...schema };
    
    // Ensure additionalProperties is false
    fixed.additionalProperties = false;
    
    // Make all properties required if they exist
    if (fixed.properties) {
      const allProperties = Object.keys(fixed.properties);
      fixed.required = allProperties;
    }
    
    return fixed;
  }

  /**
   * Parse Responses API response into standardized format
   */
  private parseResponse(response: any): ResponsesResponse {
    const output = response.output[0];
    
    if (output.type === "web_search_call") {
      return {
        content: `Web search was performed for: ${output.action?.query || 'unknown query'}`,
        toolCalls: [{
          name: 'web_search',
          arguments: { query: output.action?.query },
          type: 'web_search_call'
        }],
        metadata: { outputType: 'web_search_call', output }
      };
    }

    if (output.type === "code_interpreter_call") {
      return {
        content: `Code interpreter was executed`,
        toolCalls: [{
          name: 'code_interpreter',
          arguments: { code: output.action?.code },
          type: 'code_interpreter_call'
        }],
        metadata: { outputType: 'code_interpreter_call', output }
      };
    }

    if (output.type === "file_search_call") {
      return {
        content: `File search was performed for: ${output.action?.query || 'unknown query'}`,
        toolCalls: [{
          name: 'file_search',
          arguments: { query: output.action?.query },
          type: 'file_search_call'
        }],
        metadata: { outputType: 'file_search_call', output }
      };
    }
    
    if (output.type === "function_call") {
      return {
        content: `Function ${output.name} was called`,
        toolCalls: [{
          name: output.name,
          arguments: JSON.parse(output.arguments),
          type: 'function_call'
        }],
        metadata: { outputType: 'function_call', output }
      };
    }
    
    if (output.type === "message") {
      const content = output.content[0];
      if (content.type === "output_text") {
        return {
          content: content.text,
          metadata: { outputType: 'message', output }
        };
      }
    }
    
    return {
      content: "No response content available",
      metadata: { outputType: 'unknown', output }
    };
  }
}

// Export singleton instance
export const responsesClient = new ResponsesClient();
