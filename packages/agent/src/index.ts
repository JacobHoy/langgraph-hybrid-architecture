import { SimpleAgent } from './simple-agent';
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
  private simpleAgent: SimpleAgent;

  constructor() {
    this.simpleAgent = new SimpleAgent({
      temperature: 0.7,
    });
  }

  /**
   * Run the agent with a message and optional configuration
   */
  async runAgent(message: string, options?: AgentOptions): Promise<string> {
    const response = await this.simpleAgent.runAgent(message, options);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.response;
  }

  /**
   * Get available tools
   */
  getAvailableTools(): { customTools: string[]; builtInTools: string[] } {
    return this.simpleAgent.getAvailableTools();
  }

  /**
   * Enable structured output
   */
  enableStructuredOutput() {
    featureFlags.enableStructuredOutput();
  }

  /**
   * Disable structured output
   */
  disableStructuredOutput() {
    featureFlags.disableStructuredOutput();
  }

  /**
   * Toggle structured output
   */
  toggleStructuredOutput() {
    featureFlags.toggleStructuredOutput();
  }

  /**
   * Enable file search
   */
  enableFileSearch() {
    featureFlags.enableFileSearch();
  }

  /**
   * Disable file search
   */
  disableFileSearch() {
    featureFlags.disableFileSearch();
  }

  /**
   * Toggle file search
   */
  toggleFileSearch() {
    featureFlags.toggleFileSearch();
  }

  /**
   * Enable retrieval
   */
  enableRetrieval() {
    featureFlags.enableRetrieval();
  }

  /**
   * Disable retrieval
   */
  disableRetrieval() {
    featureFlags.disableRetrieval();
  }

  /**
   * Toggle retrieval
   */
  toggleRetrieval() {
    featureFlags.toggleRetrieval();
  }

  /**
   * Enable computer use
   */
  enableComputerUse() {
    featureFlags.enableComputerUse();
  }

  /**
   * Disable computer use
   */
  disableComputerUse() {
    featureFlags.disableComputerUse();
  }

  /**
   * Toggle computer use
   */
  toggleComputerUse() {
    featureFlags.toggleComputerUse();
  }

  /**
   * Upload a file for search
   */
  async uploadFileForSearch(filePath: string, fileName?: string): Promise<string> {
    // ReAct agent doesn't support file uploads yet
    throw new Error("File upload not supported in ReAct agent");
  }

  /**
   * Upload a document for retrieval
   */
  async uploadDocumentForRetrieval(filePath: string, fileName?: string): Promise<string> {
    // ReAct agent doesn't support document uploads yet
    throw new Error("Document upload not supported in ReAct agent");
  }

  /**
   * List search files
   */
  async listSearchFiles(): Promise<any[]> {
    // ReAct agent doesn't support file listing yet
    throw new Error("File listing not supported in ReAct agent");
  }

  /**
   * List retrieval documents
   */
  async listRetrievalDocuments(): Promise<any[]> {
    // ReAct agent doesn't support document listing yet
    throw new Error("Document listing not supported in ReAct agent");
  }
}

// Export singleton instance
export const agentAPI = new AgentAPI();

