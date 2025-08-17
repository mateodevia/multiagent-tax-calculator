import { Agent } from '../agents/Agent';
import { DebateCoordinator } from '../coordination/DebateCoordinator';
import { AgentConfig, Tools } from '../types';

export class BasicExample {
  private coordinator: DebateCoordinator;

  constructor() {
    const agentConfigs: AgentConfig[] = [
      {
        name: "Claude",
        role: "AI assistant",
        model: "anthropic",
        modelName: "claude-3-haiku-20240307",
        allowedTools: [Tools.WEB_SEARCH, Tools.READ_LOCAL_FILE, Tools.LIST_LOCAL_FILES],
        systemPrompt: `You are an AI assistant that can answer questions and help with tasks. You have access to tools that can read local files and search the web. 

IMPORTANT: When asked about personal information (like someone's name), you MUST:
1. First use list_local_files to see what files are available
2. Then use read_local_file to read any relevant files (like personal_info.txt)
3. Use the information from those files to answer the question accurately

For factual questions, use web_search to get current information.

Always use your tools when they could provide relevant information. Don't just say you don't know - actively search for the information using your available tools.`
      },
      {
        name: "Gemini", 
        role: "AI assistant",
        model: "google",
        modelName: "gemini-1.5-flash",
        allowedTools: [Tools.WEB_SEARCH, Tools.READ_LOCAL_FILE, Tools.LIST_LOCAL_FILES],
        systemPrompt: `You are an AI assistant that can answer questions and help with tasks. You have access to tools that can read local files and search the web.

IMPORTANT: When asked about personal information (like someone's name), you MUST:
1. First use list_local_files to see what files are available
2. Then use read_local_file to read any relevant files (like personal_info.txt)
3. Use the information from those files to answer the question accurately

For factual questions, use web_search to get current information.

Always use your tools when they could provide relevant information. Don't just say you don't know - actively search for the information using your available tools.`
      },
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
      "Whats my name?",
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