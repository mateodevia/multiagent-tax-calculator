import { Tool } from '@langchain/core/tools';
import { WebSearchTool } from './WebSearchTool';
import { LocalFileReadTool, LocalFileListTool } from './LocalFileTools';
import { Tools } from '../types';

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>) => Promise<string>;
}

const TOOL_REGISTRY: Record<Tools, () => Tool> = {
  [Tools.WEB_SEARCH]: () => new WebSearchTool(),
  [Tools.READ_LOCAL_FILE]: () => new LocalFileReadTool(),
  [Tools.LIST_LOCAL_FILES]: () => new LocalFileListTool()
};

export const createMCPTools = (allowedTools?: Tools[]): Tool[] => {
  if (!allowedTools || allowedTools.length === 0) {
    // Default behavior: return all tools
    return [
      new WebSearchTool(),
      new LocalFileReadTool(),
      new LocalFileListTool()
    ];
  }

  return allowedTools.map(Tools => {
    const toolFactory = TOOL_REGISTRY[Tools];
    if (!toolFactory) {
      throw new Error(`Unknown tool type: ${Tools}`);
    }
    return toolFactory();
  });
};