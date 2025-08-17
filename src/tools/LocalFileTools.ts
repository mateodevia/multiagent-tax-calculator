import { Tool } from '@langchain/core/tools';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Tools } from '../types';

export class LocalFileReadTool extends Tool {
  name = Tools.READ_LOCAL_FILE;
  description = 'Read files from the src/context/localFiles directory. Useful for accessing project-specific documentation, configurations, and context files.';
  
  protected async _call(filename: string): Promise<string> {
    try {
      const safePath = path.join(process.cwd(), 'src', 'context', 'localFiles', path.basename(filename));
      
      // Security check: ensure the path is within the allowed directory
      const resolvedPath = path.resolve(safePath);
      const allowedDir = path.resolve(process.cwd(), 'src', 'context', 'localFiles');
      
      if (!resolvedPath.startsWith(allowedDir)) {
        return 'Error: Access denied. File must be within src/context/localFiles directory.';
      }
      
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return content;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return `Error: File '${filename}' not found in src/context/localFiles directory.`;
      }
      return `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class LocalFileListTool extends Tool {
  name = Tools.LIST_LOCAL_FILES;
  description = 'List all files available in the src/context/localFiles directory.';
  
  protected async _call(): Promise<string> {
    try {
      const localFilesDir = path.join(process.cwd(), 'src', 'context', 'localFiles');
      const files = await fs.readdir(localFilesDir);
      
      if (files.length === 0) {
        return 'No files found in src/context/localFiles directory.';
      }
      
      const fileList = files
        .filter((file: string) => !file.startsWith('.'))
        .map((file: string) => `- ${file}`)
        .join('\n');
      
      return `Available files in src/context/localFiles:\n${fileList}`;
    } catch (error) {
      return `Error listing files: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}