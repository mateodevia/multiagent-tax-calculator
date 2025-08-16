import { Agent } from '../agents/Agent';
import { DebateCoordinator } from '../coordination/DebateCoordinator';
import { AgentConfig } from '../types';

export class TaxCalculatorExample {
  private coordinator: DebateCoordinator;

  constructor() {
    const agentConfigs: AgentConfig[] = [
      {
        name: "TaxExpert",
        role: "Tax Law Specialist",
        model: "anthropic",
        modelName: "claude-3-haiku-20240307",
        systemPrompt: `You are a tax law expert specializing in complex tax calculations and regulations. 
        Your role is to provide accurate, legally sound tax advice based on current tax codes. 
        Focus on technical accuracy and cite relevant tax codes when applicable.
        Always consider edge cases and potential complications.`
      },
      {
        name: "AccountingPro", 
        role: "Certified Public Accountant",
        model: "anthropic",
        modelName: "claude-3-haiku-20240307",
        systemPrompt: `You are a CPA with extensive experience in tax preparation and financial planning.
        Your role is to provide practical, client-focused tax advice that balances compliance with optimization.
        Consider the broader financial implications of tax decisions.
        Focus on actionable recommendations and risk management.`
      },
      {
        name: "FinancialAdvisor",
        role: "Financial Planning Specialist", 
        model: "anthropic",
        modelName: "claude-3-haiku-20240307",
        systemPrompt: `You are a financial advisor who specializes in tax-efficient financial planning.
        Your role is to consider the long-term financial impact of tax decisions.
        Focus on strategic planning, investment implications, and holistic financial health.
        Always consider how tax decisions fit into broader financial goals.`
      }
    ];

    const agents = agentConfigs.map(config => new Agent(config));
    this.coordinator = new DebateCoordinator(agents, 3, 0.7);
  }

  async calculateComplexTax(scenario: string): Promise<void> {
    console.log("🏛️  Starting Multi-Agent Tax Calculation Debate");
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
      "A freelance software developer earned $120,000 in 2023, has $15,000 in business expenses, contributes $6,000 to an IRA, and is considering whether to elect S-Corp status. What's the optimal tax strategy?",
      
      "A married couple filing jointly has $180,000 combined income, $25,000 in mortgage interest, $12,000 in state taxes, two children, and $8,000 in childcare expenses. Should they itemize or take the standard deduction?",
      
      "A small business owner sold their company for $2.5M after owning it for 6 years. They want to minimize capital gains tax. What are their options for tax optimization?"
    ];

    for (let i = 0; i < scenarios.length; i++) {
      console.log(`\n\n🚀 SCENARIO ${i + 1}:`);
      await this.calculateComplexTax(scenarios[i]);
      
      if (i < scenarios.length - 1) {
        console.log("\n" + "=".repeat(80));
        await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause between scenarios
      }
    }
  }
}