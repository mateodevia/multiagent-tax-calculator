import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentConfig, DebateMessage } from '../types';
import { ModelFactory } from '../models/ModelFactory';

export class Agent {
  private model: BaseChatModel;
  public readonly name: string;
  public readonly role: string;
  private systemPrompt: string;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.role = config.role;
    this.systemPrompt = config.systemPrompt;
    this.model = ModelFactory.createModel(config.model, config.modelName);
  }

  async generateResponse(prompt: string, context?: DebateMessage[]): Promise<string> {
    const messages = [new SystemMessage(this.systemPrompt)];
    
    if (context && context.length > 0) {
      const contextText = context
        .map(msg => `${msg.agent}: ${msg.content}`)
        .join('\n\n');
      messages.push(new HumanMessage(`Previous discussion:\n${contextText}\n\nNow respond to: ${prompt}`));
    } else {
      messages.push(new HumanMessage(prompt));
    }

    const response = await this.model.invoke(messages);
    return response.content as string;
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