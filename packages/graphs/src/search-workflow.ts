import { logGraphEvent } from "@langgraph-minimal/core";
import { searchTool } from "@langgraph-minimal/tools";

// Simple search workflow (we'll add LangGraph later when API is stable)
export const runSearchWorkflow = async (query: string) => {
  logGraphEvent("search_workflow_started", { query });
  
  // Perform search
  const searchResults = await searchTool.execute({
    query,
    maxResults: 5
  });
  
  // Generate summary
  const summary = `Found ${searchResults.totalResults} results for "${query}". The search returned relevant information about the topic.`;
  
  const result = {
    query,
    searchResults,
    summary
  };
  
  logGraphEvent("search_workflow_completed", { result });
  
  return result;
};
