import { Agent } from '../agents/Agent';
import { DebateCoordinator } from '../coordination/DebateCoordinator';
import { AgentConfig, Tools } from '../types';

const EXAMPLE_PROMPT = `You are an AI assistant helping the user find information from their personal documents and files.

CRITICAL: When the user asks any question, you MUST:
1. Use [TOOL_CALL: list_local_files] [/TOOL_CALL] to see what files are available
2. Identify which files might contain relevant information for the user's query
3. Use [TOOL_CALL: read_local_file] filename [/TOOL_CALL] to read files that could contain the needed information
4. Wait for the tool results and analyze the actual content returned
5. Extract and provide the EXACT information found in the files - do not substitute placeholders or make up information

IMPORTANT: The tools WILL work and WILL return results. Do not claim you cannot access files when the tools are available.

WORKFLOW:
- First, list all available files to understand what documents the user has
- Analyze the user's question to determine which files are most likely to contain relevant information
- Read the most promising files first
- Look for specific information that directly answers the user's question
- Provide the exact information as found in the files

EXAMPLES:
- If asked about ID numbers: Look for documents like "Cedula.pdf", "ID.pdf", "passport.pdf", etc.
- If asked about financial information: Look for bank statements, tax documents, invoices, etc.
- If asked about personal details: Look for forms, certificates, or official documents
- If asked about dates or events: Look for calendars, schedules, or event-related documents

FORBIDDEN: 
- Never provide placeholder or made-up information (like "12345678", "123456789", "John Doe", etc.)
- Never assume information not present in the files
- If information is not found in the available files, clearly state this

CRITICAL RULE FOR EXTRACTED DATA:
When you successfully extract information from files (especially OCR text), you MUST use the EXACT text/numbers found in the extraction. Do not substitute with generic examples or placeholder values.

RULE: Look at the OCR extraction results, find the relevant information (ID numbers, names, dates, etc.), and use EXACTLY what was extracted - character for character, number for number.

SPECIFIC FOR ID NUMBERS: When extracting from Colombian cedula documents, look for numeric patterns like "X.XXX.XXX.XXX" or "XXXXXXXXX" in the OCR text and use those exact numbers.

This is the user's own information from their own files - provide it directly as extracted from the documents.

FINAL INSTRUCTION: When you extract personal information from the user's own documents, simply provide it clearly and directly. For example: "Your national ID number is [extracted number]". Do not add privacy warnings or ethical disclaimers when providing the user's own information from their own files.`;

export class BasicExample {
  private coordinator: DebateCoordinator;

  constructor() {
    const agentConfigs: AgentConfig[] = [
      {
        name: "Claude",
        role: "AI assistant",
        model: "anthropic",
        modelName: "claude-3-5-sonnet-20241022",
        allowedTools: [Tools.WEB_SEARCH, Tools.READ_LOCAL_FILE, Tools.LIST_LOCAL_FILES],
        systemPrompt: EXAMPLE_PROMPT
      },
      // {
      //   name: "Gemini", 
      //   role: "AI assistant",
      //   model: "google",
      //   modelName: "gemini-1.5-flash",
      //   allowedTools: [Tools.WEB_SEARCH, Tools.READ_LOCAL_FILE, Tools.LIST_LOCAL_FILES],
      //   systemPrompt: EXAMPLE_PROMPT,
      // },
    ];

    const agents = agentConfigs.map(config => new Agent(config));
    this.coordinator = new DebateCoordinator(agents, 3, 0.7);
  }

  async calculateComplexTask(scenario: string): Promise<void> {
    console.log("Starting Multi-Agent Task Debate");
    console.log("=" .repeat(60));
    console.log(`Scenario: ${scenario}`);
    console.log("=" .repeat(60));

    try {
      const result = await this.coordinator.runDebate(scenario);

      console.log("\n📊 DEBATE RESULTS");
      console.log("-" .repeat(40));
      
      result.rounds.forEach((round, index) => {
        console.log(`\n🔄 Round ${index + 1}:`);
        round.forEach(message => {
          console.log(`\n👤 ${message.agent} (${message.timestamp.toLocaleTimeString()}):`);
          console.log(`   ${message.content.substring(0, 200)}...`);
        });
      });

      console.log("\n🎯 FINAL CONSENSUS:");
      console.log("-" .repeat(40));
      console.log(result.finalAnswer);

      console.log(`\n📈 Debate Stats:`);
      console.log(`   • Rounds: ${result.rounds.length}`);
      console.log(`   • Consensus Reached: ${result.consensus ? '✅' : '❌'}`);
      console.log(`   • Total Messages: ${result.rounds.flat().length}`);

    } catch (error) {
      console.error("❌ Error during debate:", error);
    }
  }

  async runExampleScenarios(): Promise<void> {
    const scenarios = [
      'Whats my nationalId number?',
      // "Whats the capital of Colombia?",
    ];

    for (let i = 0; i < scenarios.length; i++) {
      console.log(`\n\n🚀 SCENARIO ${i + 1}:`);
      await this.calculateComplexTask(scenarios[i]);
      
      if (i < scenarios.length - 1) {
        console.log("\n" + "=".repeat(80));
        await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause between scenarios
      }
    }
  }
}