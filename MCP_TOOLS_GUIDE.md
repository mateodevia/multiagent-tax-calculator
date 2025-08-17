# MCP Tools Integration Guide

This document explains how to use the Model Context Protocol (MCP) tools integrated into the multiagent tax calculator system.

## Overview

The system now includes MCP tool support that allows agents to:
- Search the internet for current information
- Read local files from the `src/context/localFiles` directory
- List available local files

## Available Tools

### 1. Web Search Tool (`web_search`)
- **Purpose**: Search for current information, tax updates, and real-time data
- **Usage**: Agents can use this to find current tax rates, recent tax law changes, etc.
- **Example**: "using web_search current tax rates 2024"

### 2. Local File Read Tool (`read_local_file`)
- **Purpose**: Read files from the local context directory
- **Usage**: Access project-specific tax documents, guidelines, and regulations
- **Example**: "using read_local_file tax_regulations.txt"

### 3. Local File List Tool (`list_local_files`)
- **Purpose**: List all available files in the local context directory
- **Usage**: Discover what local documentation is available
- **Example**: "using list_local_files"

## Configuration

### Configuring Tool Access for Agents

You can configure agents with granular tool access using the `allowedTools` property:

```typescript
import { Tools } from '../types';

const agentConfig: AgentConfig = {
  name: "TaxExpert",
  role: "Tax Law Specialist",
  model: "anthropic",
  modelName: "claude-3-haiku-20240307",
  allowedTools: [Tools.WEB_SEARCH, Tools.READ_LOCAL_FILE], // Specific tools only
  systemPrompt: `You are a tax expert with access to web search and local files...`
};
```

### Tool Access Options

- **Specific tools**: Pass an array of tool enums: `[Tools.WEB_SEARCH]`, `[Tools.READ_LOCAL_FILE, Tools.LIST_LOCAL_FILES]`
- **All tools**: Omit `allowedTools` to give access to all tools by default  
- **No tools**: Pass an empty array `[]` or omit the property entirely

### System Prompt Guidelines

When enabling MCP tools, update the system prompt to inform the agent about tool availability:

```typescript
systemPrompt: `You are a tax expert specializing in complex calculations.
Use web_search to find current tax regulations and read_local_file to access 
local tax documents when needed. Use list_local_files to see what's available.`
```

## Local Files Directory

The `src/context/localFiles/` directory contains:
- `tax_regulations.txt` - Current tax brackets and standard deductions
- `deduction_guidelines.txt` - Common deductions and limits

### Adding New Local Files

1. Place files in `src/context/localFiles/`
2. Files should be text-based (.txt, .md, .json, etc.)
3. Use descriptive filenames
4. Update agent system prompts to reference new files

## How Tool Calling Works

1. **Agent Response Analysis**: When agents respond, the system scans for tool usage patterns
2. **Pattern Matching**: Looks for phrases like "using tool_name" or "tool_name(parameter)"
3. **Tool Execution**: Automatically executes the requested tool
4. **Result Integration**: Replaces the tool call with the actual result

### Tool Usage Patterns

Agents can invoke tools using these patterns:
- `using web_search current tax rates`
- `web_search(tax deductions 2024)`
- `read_local_file(tax_regulations.txt)`
- `using read_local_file deduction_guidelines.txt`

## Testing MCP Tools

Run the test suite to verify tool functionality:

```bash
npm run build
node dist/examples/MCPToolsTest.js
```

## Example Agent Configurations

### Specialized Agent Roles

```typescript
import { Tools } from '../types';

// Tax Expert: Web search + local files
const taxExpert: AgentConfig = {
  name: "TaxExpert",
  role: "Tax Law Specialist",
  allowedTools: [Tools.WEB_SEARCH, Tools.READ_LOCAL_FILE],
  systemPrompt: "Use web_search for current regulations and read_local_file for documentation."
};

// Accountant: Only local files
const accountant: AgentConfig = {
  name: "AccountingPro",
  role: "CPA",
  allowedTools: [Tools.READ_LOCAL_FILE, Tools.LIST_LOCAL_FILES],
  systemPrompt: "Access local guidelines and discover available documentation."
};

// Financial Advisor: Only web search
const advisor: AgentConfig = {
  name: "FinancialAdvisor", 
  role: "Financial Planner",
  allowedTools: [Tools.WEB_SEARCH],
  systemPrompt: "Search for current market and investment tax information."
};

// Research Agent: No tools (pure LLM)
const researcher: AgentConfig = {
  name: "ResearchAgent",
  role: "Research Specialist", 
  // No allowedTools property = no tool access
  systemPrompt: "Provide analysis based on your training data and reasoning capabilities."
};
```

## Example Agent Interaction

```typescript
// Agent with MCP tools enabled
const response = await agent.generateResponse(
  "What are the current tax brackets for 2024?"
);

// If the agent uses: "using web_search current tax rates 2024"
// The response will include: "[Tool Result from web_search]: The 2024 federal..."
```

## Benefits

1. **Real-time Information**: Agents can access current tax information
2. **Local Context**: Access to project-specific documentation
3. **Enhanced Accuracy**: Agents can reference authoritative sources
4. **Flexibility**: Easy to add new tools and local files

## Best Practices

1. **Specific Queries**: Use specific search terms for better results
2. **File Organization**: Keep local files well-organized and documented
3. **System Prompts**: Clearly instruct agents on when and how to use tools
4. **Error Handling**: Tools gracefully handle errors and missing files

## Security Considerations

- Local file access is restricted to the `src/context/localFiles` directory
- Path traversal attempts are blocked
- Web search uses safe, read-only APIs
- No sensitive information should be stored in local files

## Future Enhancements

Potential improvements:
- Integration with real search APIs (Google, Bing)
- Support for more file formats (PDF, Excel)
- Database connectivity tools
- API integration tools for tax services