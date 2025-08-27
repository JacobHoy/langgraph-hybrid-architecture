import { z } from 'zod';
import OpenAI from 'openai';
import { Tool, toolRegistry } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Web Search Tool Wrapper
const WebSearchParams = z.object({
  query: z.string().describe("Search query to find information on the web")
});

export const webSearchTool: Tool = {
  name: "web_search",
  description: "Search the web for current information and news",
  parameters: WebSearchParams,
  jsonSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query to find information on the web"
      }
    },
    required: ["query"]
  },
  execute: async (args) => {
    const { query } = WebSearchParams.parse(args);
    
    try {
      // This is the LangGraph recommended pattern:
      // Replace my_tool with wrappers around OpenAI built‑in tools
      const response = await openai.responses.create({
        model: "gpt-5-mini",
        input: [{ role: "user", content: `Search the web for: ${query}` }],
        tools: [{ type: "web_search_preview" }], // ← Built-in OpenAI tool
      });
      
      // Extract search results from the response
      const searchResults = (response.output as any).find((output: any) => 
        output.type === "message"
      )?.content?.find((item: any) => 
        item.type === "output_text"
      )?.text || "No search results found";
      
      return {
        success: true,
        query,
        results: searchResults
      };
    } catch (error) {
      console.error('Web search error:', error);
      return {
        success: false,
        query,
        error: `Failed to search the web: ${error}`
      };
    }
  }
};

// Code Interpreter Tool Wrapper
const CodeInterpreterParams = z.object({
  code: z.string().describe("Code to execute or analyze")
});

export const codeInterpreterTool: Tool = {
  name: "code_interpreter",
  description: "Execute and analyze code using OpenAI's code interpreter",
  parameters: CodeInterpreterParams,
  jsonSchema: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "Code to execute or analyze"
      }
    },
    required: ["code"]
  },
  execute: async (args) => {
    const { code } = CodeInterpreterParams.parse(args);
    
    try {
      const response = await openai.responses.create({
        model: "gpt-5-mini",
        input: [{ role: "user", content: `Execute this code: ${code}` }],
        tools: [{ 
          type: "code_interpreter",
          container: { type: "auto" }
        }], // ← Built-in OpenAI tool
      });
      
      // Extract code execution results
      const executionResults = (response.output as any).find((output: any) => 
        output.type === "message"
      )?.content?.find((item: any) => 
        item.type === "output_text"
      )?.text || "No execution results found";
      
      return {
        success: true,
        code,
        results: executionResults
      };
    } catch (error) {
      console.error('Code interpreter error:', error);
      return {
        success: false,
        code,
        error: `Failed to execute code: ${error}`
      };
    }
  }
};

// Local File Search Tool
const FileSearchParams = z.object({
  query: z.string().describe("Search query for files")
});

// Helper function to search files recursively
function searchFilesRecursively(dir: string, query: string, maxDepth: number = 3, currentDepth: number = 0): Array<{file: string, matches: string[], content: string}> {
  const results: Array<{file: string, matches: string[], content: string}> = [];
  
  if (currentDepth >= maxDepth) return results;
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
          continue;
        }
        
        // Recursively search subdirectories
        const subResults = searchFilesRecursively(fullPath, query, maxDepth, currentDepth + 1);
        results.push(...subResults);
      } else if (stat.isFile()) {
        // Check if it's a text file we can search
        const ext = path.extname(item).toLowerCase();
        const searchableExtensions = ['.ts', '.js', '.json', '.md', '.txt', '.yml', '.yaml', '.xml', '.html', '.css', '.scss'];
        
        if (searchableExtensions.includes(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            const matches: string[] = [];
            
            // Search for query in file content
            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(query.toLowerCase())) {
                matches.push(`Line ${index + 1}: ${line.trim()}`);
              }
            });
            
            if (matches.length > 0) {
              results.push({
                file: fullPath,
                matches: matches.slice(0, 5), // Limit to first 5 matches
                content: content.substring(0, 500) // Limit content preview
              });
            }
          } catch (readError) {
            // Skip files that can't be read
            continue;
          }
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be accessed
    return results;
  }
  
  return results;
}

export const fileSearchTool: Tool = {
  name: "file_search",
  description: "Search through project files for specific content",
  parameters: FileSearchParams,
  jsonSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for files"
      }
    },
    required: ["query"]
  },
  execute: async (args) => {
    const { query } = FileSearchParams.parse(args);
    
    try {
      // Get the project root directory
      const projectRoot = process.cwd();
      
      // Search for files containing the query
      const searchResults = searchFilesRecursively(projectRoot, query);
      
      if (searchResults.length === 0) {
        return {
          success: true,
          query,
          results: `No files found containing "${query}" in the project directory.`,
          filesFound: 0
        };
      }
      
      // Format the results
      const formattedResults = searchResults.map(result => {
        const relativePath = path.relative(projectRoot, result.file);
        return {
          file: relativePath,
          matches: result.matches,
          preview: result.content.substring(0, 200) + '...'
        };
      });
      
      const summary = `Found ${searchResults.length} file(s) containing "${query}":\n\n` +
        formattedResults.map(result => 
          `📁 ${result.file}\n${result.matches.join('\n')}\n`
        ).join('\n');
      
      return {
        success: true,
        query,
        results: summary,
        filesFound: searchResults.length,
        detailedResults: formattedResults
      };
    } catch (error) {
      console.error('File search error:', error);
      return {
        success: false,
        query,
        error: `Failed to search files: ${error}`
      };
    }
  }
};

// Register all built-in tool wrappers
toolRegistry.register(webSearchTool);
toolRegistry.register(codeInterpreterTool);
toolRegistry.register(fileSearchTool);
