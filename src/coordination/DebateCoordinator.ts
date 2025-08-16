import { Agent } from '../agents/Agent';
import { DebateMessage, DebateResult } from '../types';

export class DebateCoordinator {
  private agents: Agent[];
  private maxRounds: number;
  private convergenceThreshold: number;

  constructor(agents: Agent[], maxRounds: number = 3, convergenceThreshold: number = 0.8) {
    this.agents = agents;
    this.maxRounds = maxRounds;
    this.convergenceThreshold = convergenceThreshold;
  }

  async runDebate(prompt: string): Promise<DebateResult> {
    const allRounds: DebateMessage[][] = [];
    let currentRound = 0;

    // Initial round - each agent responds independently
    let currentMessages = await this.runInitialRound(prompt, currentRound);
    allRounds.push(currentMessages);
    currentRound++;

    // Debate rounds - agents critique and refine
    while (currentRound < this.maxRounds) {
      const newMessages: DebateMessage[] = [];
      
      for (const agent of this.agents) {
        const critique = await agent.critique(currentMessages, prompt);
        newMessages.push({
          agent: agent.name,
          content: critique,
          timestamp: new Date(),
          round: currentRound
        });
      }

      allRounds.push(newMessages);
      currentMessages = newMessages;
      currentRound++;

      // Check for convergence (simplified - in practice you'd use more sophisticated methods)
      if (this.checkConvergence(newMessages)) {
        console.log(`Convergence reached after ${currentRound} rounds`);
        break;
      }
    }

    // Final synthesis round
    const finalAgent = this.selectSynthesizer();
    const finalSynthesis = await finalAgent.synthesize(
      allRounds.flat(),
      prompt
    );

    return {
      finalAnswer: finalSynthesis,
      reasoning: this.extractReasoning(allRounds),
      consensus: currentRound < this.maxRounds, // True if converged early
      rounds: allRounds
    };
  }

  private async runInitialRound(prompt: string, round: number): Promise<DebateMessage[]> {
    const messages: DebateMessage[] = [];
    
    // Run all agents in parallel for the initial round
    const responses = await Promise.all(
      this.agents.map(agent => agent.generateResponse(prompt))
    );

    responses.forEach((response, index) => {
      messages.push({
        agent: this.agents[index].name,
        content: response,
        timestamp: new Date(),
        round
      });
    });

    return messages;
  }

  private checkConvergence(messages: DebateMessage[]): boolean {
    // Simplified convergence check - in practice, you'd use semantic similarity
    // or other sophisticated methods to determine if agents are converging
    const responses = messages.map(msg => msg.content.toLowerCase());
    const uniqueWords = new Set();
    const totalWords = new Set();

    responses.forEach(response => {
      const words = response.split(/\s+/);
      words.forEach(word => {
        totalWords.add(word);
        if (responses.filter(r => r.includes(word)).length > 1) {
          uniqueWords.add(word);
        }
      });
    });

    const similarity = uniqueWords.size / totalWords.size;
    return similarity > this.convergenceThreshold;
  }

  private selectSynthesizer(): Agent {
    // Simple strategy: use the first agent as synthesizer
    // In practice, you might select based on performance, expertise, etc.
    return this.agents[0];
  }

  private extractReasoning(rounds: DebateMessage[][]): string {
    let reasoning = "Debate Process:\n\n";
    
    rounds.forEach((round, index) => {
      reasoning += `Round ${index + 1}:\n`;
      round.forEach(message => {
        reasoning += `- ${message.agent}: ${message.content.substring(0, 100)}...\n`;
      });
      reasoning += "\n";
    });

    return reasoning;
  }

  addAgent(agent: Agent): void {
    this.agents.push(agent);
  }

  removeAgent(agentName: string): void {
    this.agents = this.agents.filter(agent => agent.name !== agentName);
  }

  getAgents(): Agent[] {
    return [...this.agents];
  }
}