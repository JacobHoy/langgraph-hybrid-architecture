import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// Model configuration
export const createModel = (modelName: string = "gpt-3.5-turbo") => {
  return new ChatOpenAI({
    modelName,
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
};

// Default model instance
export const defaultModel = createModel();

// Observability helpers
export const logGraphEvent = (event: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${event}`, data ? JSON.stringify(data, null, 2) : '');
};

export const createGraphState = (schema: z.ZodObject<any>) => {
  return z.object({
    messages: z.array(z.any()),
    ...schema.shape,
  });
};

// Common schemas
export const EchoState = createGraphState(z.object({
  input: z.string(),
  output: z.string().optional(),
}));

export type EchoStateType = z.infer<typeof EchoState>;

// Additional state schemas for different use cases
export const ChatState = createGraphState(z.object({
  question: z.string(),
  answer: z.string().optional(),
  context: z.array(z.string()).optional(),
}));

export const AnalysisState = createGraphState(z.object({
  text: z.string(),
  analysis: z.string().optional(),
  sentiment: z.string().optional(),
  keywords: z.array(z.string()).optional(),
}));
