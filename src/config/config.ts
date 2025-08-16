import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    // Use the cheapest available OpenAI model
    defaultModel: 'gpt-3.5-turbo'
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    // Use the cheapest available Anthropic model
    defaultModel: 'claude-3-haiku-20240307'
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    // Use the cheapest available Google model
    defaultModel: 'gemini-1.5-flash'
  },
  debate: {
    maxRounds: 3,
    convergenceThreshold: 0.7,
    timeout: 300000 // 5 minutes
  }
};

export function validateConfig(): boolean {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY', 
    'GOOGLE_API_KEY'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('📝 Please copy .env.example to .env and fill in your API keys');
    return false;
  }

  return true;
}