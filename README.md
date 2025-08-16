# Multi-Agent Tax Calculator

A sophisticated multi-agent workflow using LangChain with the Debate/Ensemble coordination pattern. This system employs multiple AI agents with different models (OpenAI GPT, Anthropic Claude, Google Gemini) to collaboratively solve complex tax calculation problems through structured debates.

## 🏗️ Architecture

### Core Components

- **Agent**: Individual AI agents with specific roles and different underlying models
- **DebateCoordinator**: Orchestrates multi-round debates between agents
- **ModelFactory**: Creates and manages different AI model instances
- **TaxCalculatorExample**: Demonstrates the system with realistic tax scenarios

### Debate/Ensemble Pattern

1. **Initial Round**: Each agent independently analyzes the problem
2. **Debate Rounds**: Agents critique each other's responses and refine their positions
3. **Synthesis**: A designated agent synthesizes all perspectives into a final answer
4. **Convergence Detection**: System monitors for consensus and can terminate early

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- API keys for OpenAI, Anthropic, and Google AI

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

### Running the System

```bash
# Build the project
npm run build

# Run the example scenarios
npm start

# Or run in development mode
npm run dev

# Run tests
npm test
```

## 🤖 Agent Roles

### TaxExpert (OpenAI GPT-4)
- Specializes in tax law and regulations
- Focuses on technical accuracy and legal compliance
- Cites relevant tax codes and considers edge cases

### AccountingPro (Anthropic Claude)
- Certified Public Accountant perspective
- Balances compliance with optimization
- Considers practical implementation and risk management

### FinancialAdvisor (Google Gemini)
- Financial planning specialist
- Focuses on long-term implications
- Considers broader financial goals and strategy

## 📊 Example Scenarios

The system comes with three built-in scenarios:

1. **Freelance Developer Tax Strategy**: S-Corp election decision for a software developer
2. **Joint Filing Optimization**: Itemized vs standard deduction for married couple
3. **Business Sale Tax Planning**: Capital gains optimization for business owner

## 🔧 Customization

### Adding New Agents

```typescript
const newAgentConfig: AgentConfig = {
  name: "InvestmentSpecialist",
  role: "Investment Tax Expert", 
  model: "openai",
  modelName: "gpt-4",
  systemPrompt: "You specialize in investment taxation..."
};

const agent = new Agent(newAgentConfig);
coordinator.addAgent(agent);
```

### Custom Debate Parameters

```typescript
const coordinator = new DebateCoordinator(
  agents,
  maxRounds: 5,        // Maximum debate rounds
  convergenceThreshold: 0.8  // Similarity threshold for early termination
);
```

### Different AI Models

The system supports:
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude-3-sonnet, Claude-3-opus
- **Google**: Gemini-pro, Gemini-pro-vision

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📁 Project Structure

```
src/
├── agents/           # Agent implementation
├── coordination/     # Debate coordination logic
├── models/          # AI model factory and management
├── examples/        # Example scenarios and demos
├── config/          # Configuration management
├── types.ts         # TypeScript type definitions
└── index.ts         # Main entry point
```

## 🔒 Security & Best Practices

- API keys are loaded from environment variables
- No sensitive data is logged or committed
- Each agent has isolated model instances
- Graceful error handling and timeouts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [LangChain](https://langchain.dev/)
- Supports OpenAI, Anthropic, and Google AI models
- Inspired by multi-agent coordination research