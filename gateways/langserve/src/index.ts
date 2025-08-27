import Fastify from 'fastify';
import { agentAPI } from '@langgraph-minimal/agent';

const server = Fastify({
  logger: true
});

// Main agent endpoint with enhanced parameters
server.post('/agent', async (request, reply) => {
  try {
    const { message, temperature, maxOutputTokens, topP, topLogprobs, parallelToolCalls, structuredOutput } = request.body as any;
    
    if (!message) {
      return reply.status(400).send({ error: 'Message is required' });
    }

    const options = {
      ...(temperature !== undefined && { temperature }),
      ...(maxOutputTokens !== undefined && { maxOutputTokens }),
      ...(topP !== undefined && { topP }),
      ...(topLogprobs !== undefined && { topLogprobs }),
      ...(parallelToolCalls !== undefined && { parallelToolCalls }),
      ...(structuredOutput && { structuredOutput })
    };

    const response = await agentAPI.runAgent(message, Object.keys(options).length > 0 ? options : undefined);
    
    return { response };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Get available tools
server.get('/tools', async (request, reply) => {
  try {
    const tools = agentAPI.getAvailableTools();
    return tools;
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Feature flag management endpoints
server.post('/api/enable-structured-output', async (request, reply) => {
  try {
    agentAPI.enableStructuredOutput();
    return { message: 'Structured output enabled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/disable-structured-output', async (request, reply) => {
  try {
    agentAPI.disableStructuredOutput();
    return { message: 'Structured output disabled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/toggle-structured-output', async (request, reply) => {
  try {
    agentAPI.toggleStructuredOutput();
    return { message: 'Structured output toggled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/enable-file-search', async (request, reply) => {
  try {
    agentAPI.enableFileSearch();
    return { message: 'File search enabled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/disable-file-search', async (request, reply) => {
  try {
    agentAPI.disableFileSearch();
    return { message: 'File search disabled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/toggle-file-search', async (request, reply) => {
  try {
    agentAPI.toggleFileSearch();
    return { message: 'File search toggled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/enable-retrieval', async (request, reply) => {
  try {
    agentAPI.enableRetrieval();
    return { message: 'Retrieval enabled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/disable-retrieval', async (request, reply) => {
  try {
    agentAPI.disableRetrieval();
    return { message: 'Retrieval disabled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/toggle-retrieval', async (request, reply) => {
  try {
    agentAPI.toggleRetrieval();
    return { message: 'Retrieval toggled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Computer use management endpoints
server.post('/api/enable-computer-use', async (request, reply) => {
  try {
    agentAPI.enableComputerUse();
    return { message: 'Computer use enabled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/disable-computer-use', async (request, reply) => {
  try {
    agentAPI.disableComputerUse();
    return { message: 'Computer use disabled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/toggle-computer-use', async (request, reply) => {
  try {
    agentAPI.toggleComputerUse();
    return { message: 'Computer use toggled' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// File management endpoints
server.post('/api/upload-file-search', async (request, reply) => {
  try {
    const { filePath, fileName } = request.body as any;
    
    if (!filePath) {
      return reply.status(400).send({ error: 'File path is required' });
    }

    const fileId = await agentAPI.uploadFileForSearch(filePath, fileName);
    return { fileId, message: 'File uploaded for search' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.post('/api/upload-document-retrieval', async (request, reply) => {
  try {
    const { filePath, fileName } = request.body as any;
    
    if (!filePath) {
      return reply.status(400).send({ error: 'File path is required' });
    }

    const fileId = await agentAPI.uploadDocumentForRetrieval(filePath, fileName);
    return { fileId, message: 'Document uploaded for retrieval' };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.get('/api/list-search-files', async (request, reply) => {
  try {
    const files = await agentAPI.listSearchFiles();
    return { files };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

server.get('/api/list-retrieval-documents', async (request, reply) => {
  try {
    const documents = await agentAPI.listRetrievalDocuments();
    return { documents };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on port 3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
