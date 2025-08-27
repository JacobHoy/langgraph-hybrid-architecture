import { ResponsesClient } from './responses-client';
import { featureFlags } from './feature-flags';

export interface AgentOptions {
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

export class AgentAPI {
  private responsesClient: ResponsesClient;

  constructor() {
    this.responsesClient = new ResponsesClient({
      enableBuiltInTools: true,
      enableStructuredOutput: featureFlags.shouldEnableStructuredOutput(),
      enableFileSearch: featureFlags.shouldEnableFileSearch(),
      enableRetrieval: featureFlags.shouldEnableRetrieval(),
      enableComputerUse: featureFlags.shouldEnableComputerUse()
    });
  }

  /**
   * Run the agent with a message and optional configuration
   */
  async runAgent(message: string, options?: AgentOptions): Promise<string> {
    const response = await this.responsesClient.ask({
      input: message,
      tools: [
        {
          type: "function" as const,
          name: "weather_workflow",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The location to get weather for"
              }
            },
            required: ["location"]
          }
        },
        {
          type: "function" as const,
          name: "search_workflow",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query"
              }
            },
            required: ["query"]
          }
        }
      ],
      ...(options?.temperature !== undefined && { temperature: options.temperature }),
      ...(options?.maxOutputTokens !== undefined && { maxOutputTokens: options.maxOutputTokens }),
      ...(options?.topP !== undefined && { topP: options.topP }),
      ...(options?.topLogprobs !== undefined && { topLogprobs: options.topLogprobs }),
      ...(options?.parallelToolCalls !== undefined && { parallelToolCalls: options.parallelToolCalls }),
      ...(options?.structuredOutput && { 
        responseFormat: {
          name: options.structuredOutput.name,
          type: 'json_schema' as const,
          schema: options.structuredOutput.schema
        }
      })
    });

    // Handle structured output if present
    if (response.structuredOutput) {
      return JSON.stringify(response.structuredOutput, null, 2);
    }

    return response.content;
  }

  /**
   * Get available tools
   */
  getAvailableTools(): { customTools: string[]; builtInTools: string[] } {
    return {
      customTools: ['weather_workflow', 'search_workflow'],
      builtInTools: this.responsesClient.getAvailableBuiltInTools()
    };
  }

  /**
   * Enable structured output
   */
  enableStructuredOutput() {
    featureFlags.enableStructuredOutput();
    this.responsesClient.enableStructuredOutput();
  }

  /**
   * Disable structured output
   */
  disableStructuredOutput() {
    featureFlags.disableStructuredOutput();
    this.responsesClient.disableStructuredOutput();
  }

  /**
   * Toggle structured output
   */
  toggleStructuredOutput() {
    featureFlags.toggleStructuredOutput();
    if (featureFlags.shouldEnableStructuredOutput()) {
      this.responsesClient.enableStructuredOutput();
    } else {
      this.responsesClient.disableStructuredOutput();
    }
  }

  /**
   * Enable file search
   */
  enableFileSearch() {
    featureFlags.enableFileSearch();
    this.responsesClient.enableFileSearch();
  }

  /**
   * Disable file search
   */
  disableFileSearch() {
    featureFlags.disableFileSearch();
    this.responsesClient.disableFileSearch();
  }

  /**
   * Toggle file search
   */
  toggleFileSearch() {
    featureFlags.toggleFileSearch();
    if (featureFlags.shouldEnableFileSearch()) {
      this.responsesClient.enableFileSearch();
    } else {
      this.responsesClient.disableFileSearch();
    }
  }

  /**
   * Enable retrieval
   */
  enableRetrieval() {
    featureFlags.enableRetrieval();
    this.responsesClient.enableRetrieval();
  }

  /**
   * Disable retrieval
   */
  disableRetrieval() {
    featureFlags.disableRetrieval();
    this.responsesClient.disableRetrieval();
  }

  /**
   * Toggle retrieval
   */
  toggleRetrieval() {
    featureFlags.toggleRetrieval();
    if (featureFlags.shouldEnableRetrieval()) {
      this.responsesClient.enableRetrieval();
    } else {
      this.responsesClient.disableRetrieval();
    }
  }

  /**
   * Enable computer use
   */
  enableComputerUse() {
    featureFlags.enableComputerUse();
    this.responsesClient.enableComputerUse();
  }

  /**
   * Disable computer use
   */
  disableComputerUse() {
    featureFlags.disableComputerUse();
    this.responsesClient.disableComputerUse();
  }

  /**
   * Toggle computer use
   */
  toggleComputerUse() {
    featureFlags.toggleComputerUse();
    if (featureFlags.shouldEnableComputerUse()) {
      this.responsesClient.enableComputerUse();
    } else {
      this.responsesClient.disableComputerUse();
    }
  }

  /**
   * Upload a file for search
   */
  async uploadFileForSearch(filePath: string, fileName?: string): Promise<string> {
    return this.responsesClient.uploadFileForSearch(filePath, fileName);
  }

  /**
   * Upload a document for retrieval
   */
  async uploadDocumentForRetrieval(filePath: string, fileName?: string): Promise<string> {
    return this.responsesClient.uploadDocumentForRetrieval(filePath, fileName);
  }

  /**
   * List search files
   */
  async listSearchFiles(): Promise<any[]> {
    return this.responsesClient.listSearchFiles();
  }

  /**
   * List retrieval documents
   */
  async listRetrievalDocuments(): Promise<any[]> {
    return this.responsesClient.listRetrievalDocuments();
  }
}

// Export singleton instance
export const agentAPI = new AgentAPI();

