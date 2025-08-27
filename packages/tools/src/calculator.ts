import { z } from 'zod';
import { Tool, toolRegistry } from './types';

// Calculator tool
const CalculatorParams = z.object({
  expression: z.string().describe("Mathematical expression to evaluate, e.g. '2 + 2 * 3'")
});

export const calculatorTool: Tool = {
  name: "calculate",
  description: "Perform mathematical calculations",
  parameters: CalculatorParams,
  jsonSchema: {
    type: "object",
    properties: {
      expression: { 
        type: "string",
        description: "Mathematical expression to evaluate, e.g. '2 + 2 * 3'"
      },
    },
    required: ["expression"]
  },
  execute: async (args) => {
    const { expression } = CalculatorParams.parse(args);
    
    try {
      // Safe evaluation - in production, use a proper math library
      const result = eval(expression);
      const roundedResult = Number(result.toFixed(2)); // Default to 2 decimal places
      
      return {
        expression,
        result: roundedResult
      };
    } catch (error) {
      throw new Error(`Invalid mathematical expression: ${expression}`);
    }
  }
};











// Register all tools
toolRegistry.register(calculatorTool);
