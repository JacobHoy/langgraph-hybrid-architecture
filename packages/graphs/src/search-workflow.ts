import { logGraphEvent, logWorkflowStep, promptHelpers } from "@langgraph-minimal/core";
import OpenAI from 'openai';

// Search workflow using built-in web search (Responses API only)
export const runSearchWorkflow = async (query: string, runId?: string) => {
  logGraphEvent("search_workflow_started", { query }, runId);
  
  // For now, return a placeholder since built-in tools require Responses API
  // This workflow will be enhanced when we fully migrate to Responses API
  const searchResults = {
    query,
    results: `Search results for "${query}" would be retrieved using built-in web search`,
    totalResults: 1
  };
  
  if (runId) {
    logWorkflowStep(runId, "search_results_retrieved", { searchResults });
  }
  
  // Generate summary using LLM
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const summaryPrompt = promptHelpers.searchSummary(query, searchResults);
  
  const summaryResponse = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a search assistant. Generate comprehensive summaries of search results."
      },
      {
        role: "user",
        content: summaryPrompt
      }
    ],
    temperature: 0.3
  });

  const summary = summaryResponse.choices[0].message.content;
  
  if (runId) {
    logWorkflowStep(runId, "summary_generated", { summary });
  }
  
  const result = {
    query,
    searchResults,
    summary
  };
  
  logGraphEvent("search_workflow_completed", { result }, runId);
  
  return result;
};
