import { logGraphEvent, logWorkflowStep, promptHelpers } from "@langgraph-minimal/core";
import { weatherTool } from "@langgraph-minimal/tools";
import OpenAI from 'openai';

// Simple weather workflow (we'll add LangGraph later when API is stable)
export const runWeatherWorkflow = async (location: string, unit: string = "fahrenheit", runId?: string) => {
  logGraphEvent("weather_workflow_started", { location, unit }, runId);
  
  // Get weather data
  const weatherData = await weatherTool.execute({
    location,
    unit
  });
  
  if (runId) {
    logWorkflowStep(runId, "weather_data_retrieved", { weatherData });
  }
  
  // Generate recommendations using LLM
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const recommendationPrompt = promptHelpers.weatherRecommendation(location, weatherData);
  
  const recommendationResponse = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a weather assistant. Generate personalized recommendations based on weather data."
      },
      {
        role: "user",
        content: recommendationPrompt
      }
    ],
    temperature: 0.7
  });

  const recommendations = recommendationResponse.choices[0].message.content;
  
  if (runId) {
    logWorkflowStep(runId, "recommendations_generated", { recommendations });
  }
  
  const result = {
    location,
    unit,
    weatherData,
    recommendations
  };
  
  logGraphEvent("weather_workflow_completed", { result }, runId);
  
  return result;
};
