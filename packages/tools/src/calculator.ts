import { z } from 'zod';
import { Tool, toolRegistry } from './types';

const CalculatorParams = z.object({
  expression: z.string().describe("Mathematical expression to evaluate, e.g. '2 + 2 * 3'"),
  precision: z.number().optional().default(2).describe("Number of decimal places for the result")
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
      precision: { 
        type: "number",
        description: "Number of decimal places for the result",
        default: 2
      }
    },
    required: ["expression", "precision"]
  },
  execute: async (args) => {
    const { expression, precision } = CalculatorParams.parse(args);
    
    try {
      // Safe evaluation - in production, use a proper math library
      const result = eval(expression);
      const roundedResult = Number(result.toFixed(precision));
      
      return {
        expression,
        result: roundedResult,
        precision
      };
    } catch (error) {
      throw new Error(`Invalid mathematical expression: ${expression}`);
    }
  }
};

toolRegistry.register(calculatorTool);
