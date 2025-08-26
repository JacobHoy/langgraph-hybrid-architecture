#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Hybrid LangGraph + Agent API...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${BASE_URL}/ping`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // Test available tools
    console.log('2. Testing available tools...');
    const toolsResponse = await fetch(`${BASE_URL}/tools`);
    const toolsData = await toolsResponse.json();
    console.log('✅ Available tools:', toolsData.tools.length);
    console.log('');

    // Test agent API
    console.log('3. Testing agent API...');
    const agentResponse = await fetch(`${BASE_URL}/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: "What's the weather like in San Francisco?" 
      })
    });
    const agentData = await agentResponse.json();
    console.log('✅ Agent response:', agentData);
    console.log('');

    // Test direct workflow access
    console.log('4. Testing direct workflow access...');
    const workflowResponse = await fetch(`${BASE_URL}/workflows/weather`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: "New York, NY" })
    });
    const workflowData = await workflowResponse.json();
    console.log('✅ Workflow result:', workflowData);
    console.log('');

    console.log('🎉 All tests passed! Your hybrid architecture is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Your server is running (pnpm dev)');
    console.log('   - You have set up your .env file with OPENAI_API_KEY');
    console.log('   - The server is accessible at http://localhost:3000');
  }
}

testAPI();
