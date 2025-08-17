import { Tool } from '@langchain/core/tools';
import * as fs from 'fs/promises';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Tools } from '../types';

export class LocalFileReadTool extends Tool {
  name = Tools.READ_LOCAL_FILE;
  description = 'Read files from the src/context/localFiles directory. Supports text files (.txt, .md, .json, .csv) and PDF files (.pdf) with OCR for scanned documents. Can extract text from image-based PDFs like ID cards and forms. Useful for accessing project-specific documentation, configurations, and context files.';
  
  protected async _call(filename: string): Promise<string> {
    try {
      const safePath = path.join(process.cwd(), 'src', 'context', 'localFiles', path.basename(filename));
      
      // Security check: ensure the path is within the allowed directory
      const resolvedPath = path.resolve(safePath);
      const allowedDir = path.resolve(process.cwd(), 'src', 'context', 'localFiles');
      
      if (!resolvedPath.startsWith(allowedDir)) {
        return 'Error: Access denied. File must be within src/context/localFiles directory.';
      }
      
      // Check file extension to determine how to read it
      const fileExtension = path.extname(resolvedPath).toLowerCase();
      
      if (fileExtension === '.pdf') {
        return await this.readPdfFile(resolvedPath);
      } else {
        // Read as text file
        const content = await fs.readFile(resolvedPath, 'utf-8');
        return content;
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return `Error: File '${filename}' not found in src/context/localFiles directory.`;
      }
      return `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async readPdfFile(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      // Check if this is likely an image-based PDF
      const textLength = pdfData.text.trim().length;
      const isImageBased = textLength < 50; // Very little extractable text
      
      let content = `PDF Content from ${path.basename(filePath)}:
Pages: ${pdfData.numpages}
File Size: ${Math.round(dataBuffer.length / 1024)} KB

`;

      if (isImageBased) {
        content += `🔍 Detected image-based PDF. Attempting OCR text extraction...

`;
        try {
          const ocrText = await this.extractTextWithOCR(filePath);
          content += `${ocrText}

`;
        } catch (ocrError) {
          content += `⚠️ OCR extraction failed: ${ocrError instanceof Error ? ocrError.message : 'Unknown OCR error'}

`;
        }
      }

      content += `Direct PDF Text Content:
${pdfData.text || '(No direct text extracted)'}

PDF Metadata:
- Title: ${pdfData.info?.Title || 'N/A'}
- Author: ${pdfData.info?.Author || 'N/A'}
- Subject: ${pdfData.info?.Subject || 'N/A'}
- Creator: ${pdfData.info?.Creator || 'N/A'}
- Producer: ${pdfData.info?.Producer || 'N/A'}
- Creation Date: ${pdfData.info?.CreationDate || 'N/A'}`;

      return content;
    } catch (error) {
      return `Error reading PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async extractTextWithOCR(pdfPath: string): Promise<string> {
    const execAsync = promisify(exec);
    let worker: any;
    let tempImagePath: string | null = null;
    
    try {
      // Check if required system tools are available
      try {
        await execAsync('which pdftoppm');
        await execAsync('which tesseract');
      } catch (toolError) {
        return `OCR System Tools Not Available:

Required tools (pdftoppm and tesseract) are not installed on this system.

To enable OCR functionality, please install:
- poppler-utils (provides pdftoppm for PDF to image conversion)  
- tesseract (provides OCR text recognition)

Installation:
macOS: brew install poppler tesseract
Ubuntu: sudo apt-get install poppler-utils tesseract-ocr

Once installed, this tool will be able to extract text from image-based PDFs.`;
      }
      
      // Convert PDF first page to image using pdftoppm
      const tempDir = '/tmp';
      const imageName = `ocr_${Date.now()}`;
      const imageBasePath = path.join(tempDir, imageName);
      
      await execAsync(`pdftoppm -png -f 1 -l 1 -r 300 "${pdfPath}" "${imageBasePath}" 2>/dev/null`);
      
      // Find the generated image file (pdftoppm adds page numbers)
      tempImagePath = `${imageBasePath}-1.png`;
      
      // Verify the image was created
      try {
        await fs.access(tempImagePath);
      } catch (accessError) {
        throw new Error(`PDF to image conversion failed - output file not found: ${tempImagePath}`);
      }
      
      // Initialize Tesseract worker with logging disabled
      worker = await createWorker(['eng', 'spa'], undefined, {
        logger: () => {} // Disable all logging
      });
      
      // Read the image file and perform OCR (suppress stderr during recognition)
      const imageBuffer = await fs.readFile(tempImagePath);
      
      // Temporarily suppress stderr to hide Tesseract warnings
      const originalStderr = process.stderr.write;
      process.stderr.write = () => true;
      
      const { data: { text, confidence } } = await worker.recognize(imageBuffer);
      
      // Restore stderr
      process.stderr.write = originalStderr;
      
      // Clean up and format the result
      const cleanedText = text.trim();
      const confidencePercent = Math.round(confidence);
      
      return `OCR Text Extraction Results:
Confidence Level: ${confidencePercent}%

Extracted Text:
${cleanedText}

Technical Notes:
- PDF converted to image using pdftoppm (300 DPI)
- OCR processed with Tesseract.js
- Recognition confidence: ${confidencePercent}%
- Languages: Spanish and English

Note: OCR accuracy depends on image quality, text clarity, and document formatting.
Some characters may be misread, especially in low-quality scans or stylized fonts.`;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return `OCR Processing Failed: ${errorMessage}

This image-based PDF could not be processed for text extraction.
Common causes:
- System tools not installed (pdftoppm, tesseract)
- PDF conversion issues
- Insufficient system memory for OCR processing
- Corrupted or encrypted PDF file
- Poor image quality preventing text recognition

System Requirements:
- poppler-utils (for pdftoppm)
- tesseract (for OCR)

Install with: brew install poppler tesseract`;
      
    } finally {
      // Clean up temporary image file
      if (tempImagePath) {
        try {
          await fs.unlink(tempImagePath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      
      // Always terminate the worker to free resources
      if (worker) {
        try {
          await worker.terminate();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }
  }
}

export class LocalFileListTool extends Tool {
  name = Tools.LIST_LOCAL_FILES;
  description = 'List all files available in the src/context/localFiles directory. Shows file types including PDF support.';
  
  protected async _call(): Promise<string> {
    try {
      const localFilesDir = path.join(process.cwd(), 'src', 'context', 'localFiles');
      const files = await fs.readdir(localFilesDir);
      
      if (files.length === 0) {
        return 'No files found in src/context/localFiles directory.';
      }
      
      const fileList = files
        .filter((file: string) => !file.startsWith('.'))
        .map((file: string) => {
          const ext = path.extname(file).toLowerCase();
          const fileType = this.getFileTypeDescription(ext);
          return `- ${file} (${fileType})`;
        })
        .join('\n');
      
      return `Available files in src/context/localFiles:\n${fileList}\n\nSupported file types: Text (.txt, .md, .json, .csv), PDF (.pdf)`;
    } catch (error) {
      return `Error listing files: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private getFileTypeDescription(extension: string): string {
    switch (extension) {
      case '.pdf':
        return 'PDF document';
      case '.txt':
        return 'Text file';
      case '.md':
        return 'Markdown file';
      case '.json':
        return 'JSON file';
      case '.csv':
        return 'CSV file';
      case '.xml':
        return 'XML file';
      case '.yaml':
      case '.yml':
        return 'YAML file';
      default:
        return 'Text file';
    }
  }
}