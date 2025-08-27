import { OpenAI } from 'openai';
import { toolRegistry } from '@langgraph-minimal/tools';

export interface ResponsesClientConfig {
  model?: string;
  enableBuiltInTools?: boolean;
  enableStructuredOutput?: boolean;
  enableFileSearch?: boolean;
  enableRetrieval?: boolean;
  enableComputerUse?: boolean;
}

export interface ResponsesRequest {
  input: string;
  tools?: any[];
  responseFormat?: {
    name: string;
    type: 'json_schema';
    schema: any;
  };
  // Additional options for enhanced functionality
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topLogprobs?: number;
  parallelToolCalls?: boolean;
}

export interface ResponsesResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    type: 'web_search_call' | 'function_call' | 'code_interpreter_call' | 'file_search_call' | 'retrieval_call' | 'computer_use_call';
  }>;
  metadata?: any;
  structuredOutput?: any;
}

export class ResponsesClient {
  private openai: OpenAI;
  private config: ResponsesClientConfig;
  private containerId: string | null = null;
  private fileSearchContainerId: string | null = null;
  private vectorStoreId: string | null = null;

  constructor(config: ResponsesClientConfig = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.config = {
      model: "gpt-5-mini",
      enableBuiltInTools: true,
      enableStructuredOutput: false,
      enableFileSearch: false,
      enableRetrieval: false,
      enableComputerUse: false,
      ...config
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ResponsesClientConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ ResponsesClient configuration updated:', this.config);
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
   * Get or create a container for file search
   */
  private async getFileSearchContainer(): Promise<string> {
    if (!this.fileSearchContainerId) {
      const container = await this.openai.containers.create({
        name: "langgraph-minimal-file-search-container"
      });
      this.fileSearchContainerId = container.id;
      console.log('✅ File search container created:', this.fileSearchContainerId);
    }
    return this.fileSearchContainerId;
  }

  /**
   * Get or create a vector store for retrieval
   */
  private async getVectorStore(): Promise<string> {
    if (!this.vectorStoreId) {
      const vectorStore = await this.openai.vectorStores.create({
        name: "langgraph-minimal-vector-store"
      });
      this.vectorStoreId = vectorStore.id;
      console.log('✅ Vector store created:', this.vectorStoreId);
    }
    return this.vectorStoreId;
  }

  /**
   * Upload a file to the file search container
   */
  async uploadFileForSearch(filePath: string, fileName?: string): Promise<string> {
    const containerId = await this.getFileSearchContainer();
    
    // Create a file stream from the file path
    const fs = await import('fs');
    const fileStream = fs.createReadStream(filePath);
    
    const file = await this.openai.files.create({
      file: fileStream,
      purpose: "assistants"
    });

    console.log('✅ File uploaded for search:', file.id);
    return file.id;
  }

  /**
   * Upload a document to the vector store for retrieval
   */
  async uploadDocumentForRetrieval(filePath: string, fileName?: string): Promise<string> {
    const vectorStoreId = await this.getVectorStore();
    
    // Create a file stream from the file path
    const fs = await import('fs');
    const fileStream = fs.createReadStream(filePath);
    
    const file = await this.openai.files.create({
      file: fileStream,
      purpose: "assistants"
    });

    // Add file to vector store
    await this.openai.vectorStores.files.create(vectorStoreId, {
      file_id: file.id
    });

    console.log('✅ Document uploaded for retrieval:', file.id);
    return file.id;
  }

  /**
   * List files in the file search container
   */
  async listSearchFiles(): Promise<any[]> {
    const containerId = await this.getFileSearchContainer();
    const files = await this.openai.files.list();
    return files.data.filter(file => file.purpose === "assistants");
  }

  /**
   * List documents in the vector store
   */
  async listRetrievalDocuments(): Promise<any[]> {
    const vectorStoreId = await this.getVectorStore();
    const files = await this.openai.vectorStores.files.list(vectorStoreId);
    return files.data;
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
      ...(request.responseFormat && { 
        text: { 
          format: request.responseFormat 
        } 
      }),
      ...(request.temperature !== undefined && { temperature: request.temperature }),
      ...(request.maxOutputTokens !== undefined && { max_output_tokens: request.maxOutputTokens }),
      ...(request.topP !== undefined && { top_p: request.topP }),
      ...(request.topLogprobs !== undefined && { top_logprobs: request.topLogprobs }),
      ...(request.parallelToolCalls !== undefined && { parallel_tool_calls: request.parallelToolCalls })
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
      // Web search - real-time internet search
      tools.push({ type: "web_search_preview" as const });
      
      // Code interpreter with container management
      const containerId = await this.getContainer();
      tools.push({ type: "code_interpreter" as const, container: containerId });
      
      // File search with vector store (if enabled)
      if (this.config.enableFileSearch) {
        const vectorStoreId = await this.getVectorStore();
        tools.push({ type: "file_search" as const, vector_store_ids: [vectorStoreId] });
      }
      
      // Note: Retrieval is not supported with GPT-5-mini, use file_search instead

      // Computer use (if enabled) - allows AI to interact with user's computer
      // Note: computer_use_preview requires special organization access
      // Temporarily disabled while requesting access from OpenAI
      // if (this.config.enableComputerUse) {
      //   tools.push({ type: "computer_use_preview" as const });
      // }
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
    // OpenAI API requires 'additionalProperties: false' for tool parameters
    if (schema && schema.type === 'object' && schema.properties) {
      return { ...schema, additionalProperties: false };
    }
    return schema;
  }

  /**
   * Parse the raw OpenAI Responses API response
   */
  private parseResponse(response: any): ResponsesResponse {
    if (!response || !response.output) {
      return { content: "No response from OpenAI", metadata: { outputType: 'empty' } };
    }

    // Handle array of outputs (GPT-5 format)
    const outputs = Array.isArray(response.output) ? response.output : [response.output];
    
    // Find the message output
    const messageOutput = outputs.find((output: any) => output.type === "message");
    
    if (messageOutput && messageOutput.content && messageOutput.content.length > 0) {
      const content = messageOutput.content[0];
      if (content.type === "output_text") {
        // Check if this is structured output
        try {
          const parsedContent = JSON.parse(content.text);
          return {
            content: content.text,
            structuredOutput: parsedContent,
            metadata: { outputType: 'message', isStructured: true, output: messageOutput }
          };
        } catch {
          // Regular text content
          return {
            content: content.text,
            metadata: { outputType: 'message', isStructured: false, output: messageOutput }
          };
        }
      }
    }

    // Handle tool calls
    const toolCallsOutput = outputs.find((output: any) => output.type === "tool_calls");
    if (toolCallsOutput && toolCallsOutput.tool_calls) {
      const toolCalls = toolCallsOutput.tool_calls.map((call: any) => {
        if (call.type === "web_search") {
          return {
            name: 'web_search',
            arguments: { query: call.web_search.query },
            type: 'web_search_call'
          };
        }
        if (call.type === "code_interpreter") {
          return {
            name: 'code_interpreter',
            arguments: { code: call.code_interpreter.code },
            type: 'code_interpreter_call'
          };
        }
        if (call.type === "file_search") {
          return {
            name: 'file_search',
            arguments: { query: call.file_search.query },
            type: 'file_search_call'
          };
        }
        if (call.type === "retrieval") {
          return {
            name: 'retrieval',
            arguments: { query: call.retrieval.query },
            type: 'retrieval_call'
          };
        }
        if (call.type === "computer_use_preview") {
          return {
            name: 'computer_use_preview',
            arguments: { action: call.computer_use_preview.action },
            type: 'computer_use_call'
          };
        }
        return {
          name: call.function.name,
          arguments: call.function.arguments,
          type: 'function_call'
        };
      });
      return {
        content: `Tool calls: ${toolCalls.map((tc: any) => tc.name).join(', ')}`,
        toolCalls,
        metadata: { outputType: 'tool_calls', output: toolCallsOutput }
      };
    }
    
    return {
      content: "No response content available",
      metadata: { outputType: 'unknown', output: outputs }
    };
  }

  /**
   * Enable structured output with JSON schema
   */
  enableStructuredOutput() {
    this.config.enableStructuredOutput = true;
    console.log('✅ Structured output enabled');
  }

  /**
   * Disable structured output
   */
  disableStructuredOutput() {
    this.config.enableStructuredOutput = false;
    console.log('✅ Structured output disabled');
  }

  /**
   * Enable file search
   */
  enableFileSearch() {
    this.config.enableFileSearch = true;
    console.log('✅ File search enabled');
  }

  /**
   * Disable file search
   */
  disableFileSearch() {
    this.config.enableFileSearch = false;
    console.log('✅ File search disabled');
  }

  /**
   * Enable retrieval
   */
  enableRetrieval() {
    this.config.enableRetrieval = true;
    console.log('✅ Retrieval enabled');
  }

  /**
   * Disable retrieval
   */
  disableRetrieval() {
    this.config.enableRetrieval = false;
    console.log('✅ Retrieval disabled');
  }

  /**
   * Enable computer use
   */
  enableComputerUse() {
    this.config.enableComputerUse = true;
    console.log('✅ Computer use enabled');
  }

  /**
   * Disable computer use
   */
  disableComputerUse() {
    this.config.enableComputerUse = false;
    console.log('✅ Computer use disabled');
  }

  /**
   * Get current configuration
   */
  getConfig(): ResponsesClientConfig {
    return { ...this.config };
  }

  /**
   * Get available built-in tools
   */
  getAvailableBuiltInTools(): string[] {
    const tools = ['web_search_preview', 'code_interpreter'];
    
    if (this.config.enableFileSearch) {
      tools.push('file_search');
    }
    
    // Note: Retrieval is not supported with GPT-5-mini, use file_search instead

    // Temporarily disabled while requesting access from OpenAI
    // if (this.config.enableComputerUse) {
    //   tools.push('computer_use_preview');
    // }
    
    return tools;
  }
}
