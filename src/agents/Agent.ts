import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Tool } from '@langchain/core/tools';
import { AgentConfig, DebateMessage } from '../types';
import { ModelFactory } from '../models/ModelFactory';
import { createMCPTools } from '../tools';

export class Agent {
  private model: BaseChatModel;
  public readonly name: string;
  public readonly role: string;
  private systemPrompt: string;
  private tools: Tool[];

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.role = config.role;
    this.systemPrompt = config.systemPrompt;
    this.model = ModelFactory.createModel(config.model, config.modelName);
    this.tools = config.allowedTools ? createMCPTools(config.allowedTools) : [];
  }

  async generateResponse(prompt: string, context?: DebateMessage[]): Promise<string> {
    let enhancedSystemPrompt = this.systemPrompt;
    
    if (this.tools.length > 0) {
      const toolDescriptions = this.tools.map(tool => 
        `- ${tool.name}: ${tool.description}`
      ).join('\n');
      
      enhancedSystemPrompt += `\n\nYou have access to the following tools:\n${toolDescriptions}\n\nIMPORTANT: When you need information that could be found using these tools, you MUST use them. For example:
- If asked about personal information, use list_local_files first to see what files are available, then use read_local_file to read relevant files
- If asked about current events or factual information, use web_search
- Always use tools when they could provide relevant information to answer the question accurately

To use a tool, write your response and include tool calls in this format:
[TOOL_CALL: tool_name] arguments [/TOOL_CALL]

For example:
[TOOL_CALL: list_local_files] [/TOOL_CALL]
[TOOL_CALL: read_local_file] personal_info.txt [/TOOL_CALL]
[TOOL_CALL: web_search] capital of Colombia [/TOOL_CALL]`;
    }
    
    const messages = [new SystemMessage(enhancedSystemPrompt)];
    
    if (context && context.length > 0) {
      const contextText = context
        .map(msg => `${msg.agent}: ${msg.content}`)
        .join('\n\n');
      messages.push(new HumanMessage(`Previous discussion:\n${contextText}\n\nNow respond to: ${prompt}`));
    } else {
      messages.push(new HumanMessage(prompt));
    }

    let response = await this.model.invoke(messages);
    let responseText = response.content as string;
    
    // Process tool calls if tools are available
    if (this.tools.length > 0) {
      responseText = await this.processToolCalls(responseText);
    }
    
    return responseText;
  }

  private async processToolCalls(responseText: string): Promise<string> {
    let processedResponse = responseText;
    
    // Look for tool calls in the format [TOOL_CALL: tool_name] arguments [/TOOL_CALL]
    const toolCallPattern = /\[TOOL_CALL:\s*([^\]]+)\]\s*([^[]*?)\s*\[\/TOOL_CALL\]/gi;
    const matches = [...responseText.matchAll(toolCallPattern)];
    
    for (const match of matches) {
      const toolName = match[1].trim();
      const args = match[2].trim();
      
      try {
        const tool = this.tools.find(t => t.name === toolName);
        if (tool) {
          const toolResult = await tool.invoke(args);
          
          // Replace the tool call with the result
          processedResponse = processedResponse.replace(
            match[0], 
            `[Tool Result from ${toolName}]: ${toolResult}`
          );
        } else {
          processedResponse = processedResponse.replace(
            match[0], 
            `[Tool Error]: Unknown tool '${toolName}'`
          );
        }
      } catch (error) {
        processedResponse = processedResponse.replace(
          match[0], 
          `[Tool Error from ${toolName}]: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
    
    // Also look for simpler tool usage patterns as fallback
    for (const tool of this.tools) {
      const simplePattern = new RegExp(`(?:using\\s+)?${tool.name}\\s+(?:with\\s+)?([^\\n.]+)`, 'gi');
      const simpleMatches = [...processedResponse.matchAll(simplePattern)];
      
      for (const match of simpleMatches) {
        // Only process if this match wasn't already processed as a tool call
        if (!match[0].includes('[TOOL_CALL:') && !match[0].includes('[Tool Result')) {
          try {
            const args = match[1].trim();
            const toolResult = await tool.invoke(args);
            
            processedResponse = processedResponse.replace(
              match[0], 
              `[Tool Result from ${tool.name}]: ${toolResult}`
            );
          } catch (error) {
            processedResponse = processedResponse.replace(
              match[0], 
              `[Tool Error from ${tool.name}]: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }
    }
    
    return processedResponse;
  }

  async critique(otherResponses: DebateMessage[], originalPrompt: string): Promise<string> {
    const otherResponsesText = otherResponses
      .filter(msg => msg.agent !== this.name)
      .map(msg => `${msg.agent}: ${msg.content}`)
      .join('\n\n');

    const critiquePrompt = `
Original question: ${originalPrompt}

Other agents' responses:
${otherResponsesText}

Please critique these responses and provide your own perspective. Focus on:
1. What you agree with
2. What you disagree with and why
3. What might be missing
4. Your alternative or refined approach
`;

    return this.generateResponse(critiquePrompt);
  }

  async synthesize(allResponses: DebateMessage[], originalPrompt: string): Promise<string> {
    const allResponsesText = allResponses
      .map(msg => `${msg.agent}: ${msg.content}`)
      .join('\n\n');

    const synthesizePrompt = `
Original question: ${originalPrompt}

All agents' responses from the debate:
${allResponsesText}

Based on this discussion, provide a final synthesized answer that incorporates the best insights from all perspectives. Be decisive and clear in your final recommendation.
`;

    return this.generateResponse(synthesizePrompt);
  }
}