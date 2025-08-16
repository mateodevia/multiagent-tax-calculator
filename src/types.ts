export interface AgentConfig {
  name: string;
  role: string;
  model: 'openai' | 'anthropic' | 'google';
  modelName?: string;
  systemPrompt: string;
}

export interface DebateMessage {
  agent: string;
  content: string;
  timestamp: Date;
  round: number;
}

export interface DebateResult {
  finalAnswer: string;
  reasoning: string;
  consensus: boolean;
  rounds: DebateMessage[][];
}