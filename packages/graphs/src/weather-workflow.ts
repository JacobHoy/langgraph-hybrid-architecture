import { logGraphEvent } from "@langgraph-minimal/core";
import { weatherTool } from "@langgraph-minimal/tools";

// Simple weather workflow (we'll add LangGraph later when API is stable)
export const runWeatherWorkflow = async (location: string, unit: string = "fahrenheit") => {
  logGraphEvent("weather_workflow_started", { location, unit });
  
  // Get weather data
  const weatherData = await weatherTool.execute({
    location,
    unit
  });
  
  // Generate recommendations
  const recommendations = [
    "It's a great day for outdoor activities!",
    "Consider bringing sunglasses and sunscreen.",
    "Light clothing recommended."
  ];
  
  const result = {
    location,
    unit,
    weatherData,
    recommendations
  };
  
  logGraphEvent("weather_workflow_completed", { result });
  
  return result;
};
