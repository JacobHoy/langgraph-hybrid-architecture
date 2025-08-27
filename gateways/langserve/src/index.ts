import Fastify from "fastify";
import dotenv from "dotenv";
import { agentAPI } from "@langgraph-minimal/agent";

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Health check endpoint
fastify.get("/ping", async (request, reply) => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Agent API endpoint
fastify.post("/agent", async (request, reply) => {
  const { message } = request.body as { message: string };
  
  if (!message) {
    return reply.status(400).send({ error: "Message is required" });
  }
  
  try {
    const response = await agentAPI.runAgent(message);
    return { response };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Get available tools
fastify.get("/tools", async (request, reply) => {
  try {
    const tools = agentAPI.getAvailableTools();
    return { tools };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Feature flag management endpoints
fastify.post("/api/enable-builtin-tools", async (request, reply) => {
  try {
    agentAPI.enableBuiltInTools();
    return {
      success: true,
      message: 'Built-in tools enabled',
      flags: agentAPI.getAvailableTools().featureFlags
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
});

fastify.post("/api/disable-builtin-tools", async (request, reply) => {
  try {
    agentAPI.disableBuiltInTools();
    return {
      success: true,
      message: 'Built-in tools disabled',
      flags: agentAPI.getAvailableTools().featureFlags
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
});

fastify.post("/api/toggle-builtin-tools", async (request, reply) => {
  try {
    agentAPI.toggleBuiltInTools();
    return {
      success: true,
      message: 'Built-in tools toggled',
      flags: agentAPI.getAvailableTools().featureFlags
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
});

fastify.get("/api/flags", async (request, reply) => {
  try {
    return { 
      flags: agentAPI.getAvailableTools().featureFlags
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Individual workflow endpoints (for direct access)
fastify.post("/workflows/weather", async (request, reply) => {
  const { location, unit = "fahrenheit" } = request.body as { location: string; unit?: string };
  
  if (!location) {
    return reply.status(400).send({ error: "Location is required" });
  }
  
  try {
    const { runWeatherWorkflow } = await import("@langgraph-minimal/graphs");
    const result = await runWeatherWorkflow(location, unit);
    return { result };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
});

fastify.post("/workflows/search", async (request, reply) => {
  const { query } = request.body as { query: string };
  
  if (!query) {
    return reply.status(400).send({ error: "Query is required" });
  }
  
  try {
    const { runSearchWorkflow } = await import("@langgraph-minimal/graphs");
    const result = await runSearchWorkflow(query);
    return { result };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000");
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
