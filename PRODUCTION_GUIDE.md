# Production Guide - LangGraph Minimal

## 🎯 **Quick Production Setup**

### **1. Configuration**
```typescript
// packages/agent/src/index.ts - Production Configuration
constructor() {
  this.responsesClient = new ResponsesClient({
    enableBuiltInTools: false,  // ✅ DISABLE for stability
    enableStructuredOutput: true,
    enableFileSearch: false,
    enableRetrieval: false,
    enableComputerUse: false
  });
}
```

### **2. Environment Variables**
```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional
NODE_ENV=production
PORT=3000
```

### **3. Build & Deploy**
```bash
pnpm build
pnpm start
```

## ✅ **Production-Ready Features**

### **Stable & Reliable**
- ✅ **Structured Output**: JSON schema validation
- ✅ **Calculator Tool**: Mathematical calculations
- ✅ **Basic AI Responses**: General conversation
- ✅ **Enhanced Parameters**: Temperature, max tokens, etc.

### **Example Usage**
```bash
# ✅ WORKS: Calculator
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate 15 * 23"}'

# ✅ WORKS: Structured Output
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Extract name and age from: John is 25",
    "structuredOutput": {
      "name": "person_info",
      "schema": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "age": {"type": "number"}
        },
        "required": ["name", "age"],
        "additionalProperties": false
      }
    }
  }'
```

## ❌ **Avoid in Production**

### **Unstable Features**
- ❌ **Weather Tool**: Fails due to built-in tool dependencies
- ❌ **Built-in Web Search**: Container creation issues
- ❌ **Code Interpreter**: Container management problems
- ❌ **File Search**: Vector store creation issues

### **Example of What NOT to Use**
```bash
# ❌ AVOID: Weather (will fail)
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Weather in San Francisco"}'

# ❌ AVOID: Web search (will fail)
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Search for latest news"}'
```

## 🔍 **Troubleshooting**

### **Common Issues**
1. **"Missing required parameter: 'input'"** → Built-in tools enabled
2. **Weather tool fails** → Built-in tool dependency
3. **Container creation fails** → API rate limits

### **Solutions**
1. **Disable built-in tools**: `enableBuiltInTools: false`
2. **Use stable features only**: Calculator, structured output
3. **Monitor logs**: Check for container creation errors

## 📊 **Performance Expectations**

- **Response Time**: < 2 seconds for stable features
- **Uptime**: 99%+ with proper configuration
- **Error Rate**: < 1% for stable features

## 🚀 **Deployment Checklist**

- [ ] Built-in tools disabled (`enableBuiltInTools: false`)
- [ ] Environment variables set
- [ ] Production build completed (`pnpm build`)
- [ ] Stable features tested
- [ ] Monitoring endpoints configured
- [ ] Error handling in place

## 📞 **Support**

- **Issues**: GitHub Issues
- **Production Problems**: Check troubleshooting section
- **Feature Requests**: GitHub Discussions

---

**Remember**: Use only the stable features listed above for production deployments!
