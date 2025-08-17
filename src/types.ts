export enum Tools {
  WEB_SEARCH = 'web_search',
  READ_LOCAL_FILE = 'read_local_file',
  LIST_LOCAL_FILES = 'list_local_files'
}

export interface AgentConfig {
  name: string;
  role: string;
  model: 'openai' | 'anthropic' | 'google';
  modelName?: string;
  systemPrompt: string;
  allowedTools?: Tools[];
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