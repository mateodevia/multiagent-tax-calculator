import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { config } from '../config/config';

export class ModelFactory {
  static createModel(modelType: 'openai' | 'anthropic' | 'google', modelName?: string): BaseChatModel {
    switch (modelType) {
      case 'openai':
        return new ChatOpenAI({
          modelName: modelName || config.openai.defaultModel,
          temperature: 0.7,
        });
      
      case 'anthropic':
        return new ChatAnthropic({
          modelName: modelName || config.anthropic.defaultModel,
          temperature: 0.7,
        });
      
      case 'google':
        return new ChatGoogleGenerativeAI({
          modelName: modelName || config.google.defaultModel,
          temperature: 0.7,
        });
      
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }
}